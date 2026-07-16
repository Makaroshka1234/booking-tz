"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { subscribeToMyRooms, subscribeToJoinedRooms } from "@/lib/firestore/rooms"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RoomForm } from "@/components/forms/RoomForm"
import { RoomCard } from "@/components/RoomCard"
import type { Room } from "@/types"

export default function RoomsPage() {
  const { user, loading } = useAuth()
  const [myRooms, setMyRooms] = useState<(Room & { id: string })[]>([])
  const [joinedRooms, setJoinedRooms] = useState<(Room & { id: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    setIsLoading(true)

    const unsubscribeMyRooms = subscribeToMyRooms(user.uid, (rooms) => {
      setMyRooms(rooms)
      setIsLoading(false)
    })

    const unsubscribeJoinedRooms = subscribeToJoinedRooms(user.uid, (rooms) => {
      const filtered = rooms.filter((room) => room.createdBy !== user.uid)
      setJoinedRooms(filtered)
    })

    return () => {
      unsubscribeMyRooms()
      unsubscribeJoinedRooms()
    }
  }, [user])

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4">Завантаження кімнат...</p>
        </div>
      </div>
    )
  }

  const hasNoRooms = myRooms.length === 0 && joinedRooms.length === 0

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Кімнати</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Створити кімнату</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити нову кімнату</DialogTitle>
            </DialogHeader>
            <RoomForm
              onSuccess={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {hasNoRooms ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <h2 className="text-xl font-semibold mb-4">У вас поки немає кімнат</h2>
          <p className="text-muted-foreground mb-6">
            Створіть свою першу кімнату або попросіть у когось запрошення
          </p>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Створити першу кімнату</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Створити нову кімнату</DialogTitle>
              </DialogHeader>
              <RoomForm
                onSuccess={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          {myRooms.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Мої кімнати ({myRooms.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isCreator={true}
                  />
                ))}
              </div>
            </section>
          )}

          {joinedRooms.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Кімнати, де я учасник ({joinedRooms.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {joinedRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isCreator={false}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
