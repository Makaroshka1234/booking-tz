"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { toast } from "sonner"
import { doc, getDoc, deleteDoc } from "firebase/firestore"

import { subscribeToBookings, updateBooking } from "@/lib/firestore/bookings"
import { useBookingStore } from "@/store/useBookingStore"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { RoomHeader } from "@/components/rooms/RoomHeader"
import { BookingsSection } from "@/components/bookings/BookingsSection"
import { MembersSection } from "@/components/rooms/MembersSection"
import { BookingsSkeleton } from "@/components/skeletons/BookingsSkeleton"

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params)
  const { data: bookings, setData: setBookings, setLoading, loading } = useBookingStore()
  const { user } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState<string | null>(null)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState<string | null>(null)
  const [roomInfo, setRoomInfo] = useState<{
    name: string
    description: string
    createdBy: string
  } | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const roomRef = doc(db, "rooms", roomId)
        const snapshot = await getDoc(roomRef)
        if (snapshot.exists()) {
          setRoomInfo({
            name: snapshot.data().name,
            description: snapshot.data().description,
            createdBy: snapshot.data().createdBy,
          })
        }
      } catch (error) {
        console.error("Error loading room:", error)
      } finally {
        setRoomLoading(false)
      }
    }
    loadRoom()
  }, [roomId])

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToBookings(roomId, (updatedBookings) => {
      setBookings(updatedBookings)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [roomId, setBookings, setLoading])

  async function handleDeleteBooking(bookingId: string) {
    try {
      await deleteDoc(doc(db, "bookings", bookingId))
      toast.success("✓ Бронювання успішно видалено")
      setDeleteAlertOpen(null)
    } catch (error) {
      toast.error(
        error instanceof Error ? `✕ ${error.message}` : "✕ Помилка при видаленні бронювання"
      )
    }
  }

  async function handleUpdateBooking(
    bookingId: string,
    title: string,
    description: string | undefined,
    startTime: Date,
    endTime: Date
  ) {
    try {
      await updateBooking(bookingId, roomId, title, description, startTime, endTime)
      toast.success("✓ Бронювання успішно оновлено", {
        description: `${title} • оновлено`,
      })
      setIsEditOpen(null)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Помилка при оновленні"
      if (errorMsg.includes("Конфлікт бронювання")) {
        toast.error("⚠️ " + errorMsg, {
          description: "Виберіть інший час для цього бронювання",
          duration: 5000,
        })
      } else {
        toast.error(`✕ ${errorMsg}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <RoomHeader isLoading={true} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <BookingsSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <RoomHeader
        name={roomInfo?.name}
        description={roomInfo?.description}
        isLoading={roomLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <BookingsSection
            roomId={roomId}
            bookings={bookings}
            userId={user?.uid}
            isCreateOpen={isCreateOpen}
            onCreateOpenChange={setIsCreateOpen}
            editingId={isEditOpen}
            deletingId={deleteAlertOpen}
            onEditingChange={setIsEditOpen}
            onDeletingChange={setDeleteAlertOpen}
            onDelete={handleDeleteBooking}
            onUpdate={handleUpdateBooking}
          />
        </div>

        {roomInfo && (
          <div className="lg:col-span-1">
            <MembersSection roomId={roomId} createdBy={roomInfo.createdBy} />
          </div>
        )}
      </div>
    </div>
  )
}
