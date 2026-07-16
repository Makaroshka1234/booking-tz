"use client"

import { useEffect, useState } from "react"
import {
  subscribeToMyRooms,
  subscribeToJoinedRooms,
} from "@/lib/firestore/rooms"
import type { Room } from "@/types"

export function useRooms(uid: string | undefined) {
  const [myRooms, setMyRooms] = useState<(Room & { id: string })[]>([])
  const [joinedRooms, setJoinedRooms] = useState<(Room & { id: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) return

    const unsubscribeMyRooms = subscribeToMyRooms(uid, (rooms) => {
      setMyRooms(rooms)
      setIsLoading(false)
    })

    const unsubscribeJoinedRooms = subscribeToJoinedRooms(uid, (rooms) => {
      const filtered = rooms.filter((room) => room.createdBy !== uid)
      setJoinedRooms(filtered)
    })

    return () => {
      unsubscribeMyRooms()
      unsubscribeJoinedRooms()
    }
  }, [uid])

  return { myRooms, joinedRooms, isLoading }
}
