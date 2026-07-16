"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { toast } from "sonner"
import { doc, getDoc } from "firebase/firestore"

import { subscribeToBookings } from "@/lib/firestore/bookings"
import { useBookingStore } from "@/store/useBookingStore"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookingForm } from "@/components/forms/BookingForm"
import { MembersPanel } from "@/components/MembersPanel"

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params)
  const { bookings, setBookings, setLoading, loading } = useBookingStore()
  const { user } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [roomInfo, setRoomInfo] = useState<{
    name: string
    description: string
    createdBy: string
  } | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)

  // Load room info
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4">Завантаження бронювань...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/rooms">
            <Button variant="ghost">← Назад до кімнат</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {roomLoading ? "..." : roomInfo?.name}
            </h1>
            {roomInfo?.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {roomInfo.description}
              </p>
            )}
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Створити бронювання</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити нове бронювання</DialogTitle>
            </DialogHeader>
            <BookingForm
              roomId={roomId}
              onSuccess={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Бронювання</h2>

            {bookings.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Бронювань не знайдено</h3>
                <p className="text-muted-foreground mb-4">
                  Будьте першими, хто забронює цю кімнату
                </p>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button>+ Створити бронювання</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Створити нове бронювання</DialogTitle>
                    </DialogHeader>
                    <BookingForm
                      roomId={roomId}
                      onSuccess={() => setIsCreateOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-border rounded-lg p-4 bg-card hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{booking.title}</h3>
                        {booking.description && (
                          <p className="text-sm text-muted-foreground">
                            {booking.description}
                          </p>
                        )}
                      </div>
                      {booking.createdBy === user?.uid && (
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Ваше
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Дата:</span>
                        <span>
                          {format(
                            booking.startTime.toDate?.() || booking.startTime,
                            "d MMMM yyyy",
                            { locale: uk }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Час:</span>
                        <span>
                          {format(
                            booking.startTime.toDate?.() || booking.startTime,
                            "HH:mm",
                            { locale: uk }
                          )}{" "}
                          —{" "}
                          {format(
                            booking.endTime.toDate?.() || booking.endTime,
                            "HH:mm",
                            { locale: uk }
                          )}
                        </span>
                      </div>
                      {booking.participants.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Учасників:
                          </span>
                          <span>{booking.participants.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {roomInfo && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <MembersPanel roomId={roomId} createdBy={roomInfo.createdBy} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
