"use client"

import { RoomCard } from "@/components/rooms/RoomCard"
import type { Room } from "@/types"

interface RoomsGroupProps {
  title: string
  rooms: (Room & { id: string })[]
  isCreator: boolean
}

function RoomsGroup({ title, rooms, isCreator }: RoomsGroupProps) {
  if (rooms.length === 0) return null

  return (
    <section>
      <h2 className="heading-3 mb-4">{title} ({rooms.length})</h2>
      <div className="layout-grid-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} isCreator={isCreator} />
        ))}
      </div>
    </section>
  )
}

interface RoomsListProps {
  myRooms: (Room & { id: string })[]
  joinedRooms: (Room & { id: string })[]
}

export function RoomsList({ myRooms, joinedRooms }: RoomsListProps) {
  return (
    <>
      <RoomsGroup title="Мої кімнати" rooms={myRooms} isCreator={true} />
      <RoomsGroup title="Кімнати, де я учасник" rooms={joinedRooms} isCreator={false} />
    </>
  )
}
