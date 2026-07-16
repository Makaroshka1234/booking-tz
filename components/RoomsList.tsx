"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { subscribeToRooms, deleteRoom } from "@/lib/firestore/rooms"
import { useRoomStore } from "@/store/useRoomStore"
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
import type { Room } from "@/types"

export function RoomsList() {
  const { rooms, setRooms, setLoading } = useRoomStore()
  const { user } = useAuth()
  const [editingRoom, setEditingRoom] = useState<(Room & { id: string }) | null>(
    null
  )
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToRooms((updatedRooms) => {
      setRooms(updatedRooms)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setRooms, setLoading])

  async function handleDelete(roomId: string) {
    if (!confirm("Ви впевнені що хочете видалити цю кімнату?")) {
      return
    }

    setDeletingId(roomId)
    try {
      await deleteRoom(roomId)
      toast.success("Кімната видалена")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Помилка при видаленні"
      )
    } finally {
      setDeletingId(null)
    }
  }

  const isCreator = (createdBy: string) => createdBy === user?.uid

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Кімнат не знайдено</h2>
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
    )
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="border border-border rounded-lg p-4 bg-card hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">{room.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {room.description}
            </p>

            <div className="flex gap-2">
              <Link href={`/rooms/${room.id}`}>
                <Button variant="default" size="sm">
                  Переглянути бронювання
                </Button>
              </Link>
              {isCreator(room.createdBy) && (
                <>
                  <Dialog open={isEditOpen && editingRoom?.id === room.id} onOpenChange={(open) => {
                    if (!open) setEditingRoom(null)
                    setIsEditOpen(open)
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRoom(room)}
                      >
                        Редагувати
                      </Button>
                    </DialogTrigger>
                    {editingRoom?.id === room.id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Редагувати кімнату</DialogTitle>
                        </DialogHeader>
                        <RoomForm
                          room={editingRoom}
                          onSuccess={() => {
                            setIsEditOpen(false)
                            setEditingRoom(null)
                          }}
                        />
                      </DialogContent>
                    )}
                  </Dialog>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(room.id)}
                    disabled={deletingId === room.id}
                  >
                    {deletingId === room.id ? "Видалення..." : "Видалити"}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
