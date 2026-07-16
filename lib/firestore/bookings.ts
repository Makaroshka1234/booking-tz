import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  Timestamp,
  query,
  where,
  orderBy,
  runTransaction,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Booking } from "@/types"

const bookingsCollection = collection(db, "bookings")

/**
 * Check if time intervals conflict.
 * Conflict occurs if: newStart < existingEnd && existingStart < newEnd
 */
function hasConflict(
  newStart: Timestamp,
  newEnd: Timestamp,
  existing: { startTime: Timestamp; endTime: Timestamp }
): boolean {
  const newStartMs = newStart.toMillis()
  const newEndMs = newEnd.toMillis()
  const existingStartMs = existing.startTime.toMillis()
  const existingEndMs = existing.endTime.toMillis()

  return newStartMs < existingEndMs && existingStartMs < newEndMs
}

/**
 * Create a booking with conflict detection.
 *
 * IMPORTANT: This function uses a client-side Firestore transaction to check for conflicts
 * and create the booking atomically. However, client-side transactions have limitations:
 * - They don't guarantee full serializability for queries (only for read-modify-write on specific documents)
 * - Race conditions can still occur between query execution and write
 * - Multiple concurrent clients may still create conflicting bookings
 *
 * For production-level reliability, this logic should be moved to a Cloud Function (callable)
 * which runs on the server with guaranteed serializability and can enforce constraints.
 * See: https://firebase.google.com/docs/firestore/solutions/sched-overlap
 */
export async function createBooking(
  roomId: string,
  title: string,
  description: string | undefined,
  startTime: Date,
  endTime: Date,
  userId: string
): Promise<string> {
  const startTimestamp = Timestamp.fromDate(startTime)
  const endTimestamp = Timestamp.fromDate(endTime)

  return runTransaction(db, async (transaction) => {
    // Query all bookings for this room
    const q = query(bookingsCollection, where("roomId", "==", roomId))
    const snapshot = await getDocs(q)

    // Check for conflicts
    const conflictingBooking = snapshot.docs.find((docSnap) => {
      const booking = docSnap.data()
      return hasConflict(startTimestamp, endTimestamp, {
        startTime: booking.startTime,
        endTime: booking.endTime,
      })
    })

    if (conflictingBooking) {
      const conflict = conflictingBooking.data()
      const conflictStart = conflict.startTime.toDate().toLocaleTimeString("uk-UA")
      const conflictEnd = conflict.endTime.toDate().toLocaleTimeString("uk-UA")
      throw new Error(
        `Конфлікт бронювання: час ${conflictStart} — ${conflictEnd} вже зайнятий (бронювання "${conflict.title}")`
      )
    }

    // No conflict, create the booking
    const bookingData = {
      roomId,
      title,
      description: description || "",
      startTime: startTimestamp,
      endTime: endTimestamp,
      createdBy: userId,
      participants: [userId],
      createdAt: Timestamp.now(),
    }

    const docRef = doc(bookingsCollection)
    transaction.set(docRef, bookingData)
    return docRef.id
  })
}

/**
 * Update a booking with conflict detection.
 *
 * Same limitations as createBooking apply here regarding transaction serializability.
 * See createBooking for details.
 */
export async function updateBooking(
  bookingId: string,
  roomId: string,
  title: string,
  description: string | undefined,
  startTime: Date,
  endTime: Date
): Promise<void> {
  const startTimestamp = Timestamp.fromDate(startTime)
  const endTimestamp = Timestamp.fromDate(endTime)

  return runTransaction(db, async (transaction) => {
    // Query all other bookings for this room (excluding this one)
    const q = query(bookingsCollection, where("roomId", "==", roomId))
    const snapshot = await getDocs(q)

    // Check for conflicts with other bookings
    const conflictingBooking = snapshot.docs.find((docSnap) => {
      if (docSnap.id === bookingId) return false // Skip self

      const booking = docSnap.data()
      return hasConflict(startTimestamp, endTimestamp, {
        startTime: booking.startTime,
        endTime: booking.endTime,
      })
    })

    if (conflictingBooking) {
      const conflict = conflictingBooking.data()
      const conflictStart = conflict.startTime.toDate().toLocaleTimeString("uk-UA")
      const conflictEnd = conflict.endTime.toDate().toLocaleTimeString("uk-UA")
      throw new Error(
        `Конфлікт бронювання: час ${conflictStart} — ${conflictEnd} вже зайнятий (бронювання "${conflict.title}")`
      )
    }

    // No conflict, update the booking
    const bookingRef = doc(db, "bookings", bookingId)
    transaction.update(bookingRef, {
      title,
      description: description || "",
      startTime: startTimestamp,
      endTime: endTimestamp,
    })
  })
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const bookingRef = doc(db, "bookings", bookingId)
  await updateDoc(bookingRef, {
    // TODO: Add status field (e.g., "cancelled", "active") for soft delete
    // For now, just delete it
  })
}

export function subscribeToBookings(
  roomId: string,
  onBookingsChange: (bookings: (Booking & { id: string })[]) => void
): () => void {
  const q = query(
    bookingsCollection,
    where("roomId", "==", roomId),
    orderBy("startTime", "asc")
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const bookings: (Booking & { id: string })[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      bookings.push({
        id: doc.id,
        roomId: data.roomId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        createdBy: data.createdBy,
        participants: data.participants || [data.createdBy],
        createdAt: data.createdAt,
      } as Booking & { id: string })
    })
    onBookingsChange(bookings)
  })

  return unsubscribe
}
