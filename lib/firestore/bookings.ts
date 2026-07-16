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
import { mapBookingDoc } from "@/lib/firestore/subscriptions"
import type { Booking } from "@/types"

const bookingsCollection = collection(db, "bookings")

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

async function assertNoConflict(
  roomId: string,
  startTimestamp: Timestamp,
  endTimestamp: Timestamp,
  excludeId?: string
): Promise<void> {
  const q = query(bookingsCollection, where("roomId", "==", roomId))
  const snapshot = await getDocs(q)

  const conflictingBooking = snapshot.docs.find((docSnap) => {
    if (excludeId && docSnap.id === excludeId) return false
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
}

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
    await assertNoConflict(roomId, startTimestamp, endTimestamp)

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
    await assertNoConflict(roomId, startTimestamp, endTimestamp, bookingId)

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
  await updateDoc(bookingRef, {})
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
    const bookings = snapshot.docs.map(mapBookingDoc)
    onBookingsChange(bookings)
  })

  return unsubscribe
}
