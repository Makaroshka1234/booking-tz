"use client";

import { useEffect, useState } from "react";

import {
  subscribeToMyRooms,
  subscribeToJoinedRooms,
} from "@/lib/firestore/rooms";
import { useAuth } from "@/hooks/useAuth";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { RoomsSkeleton } from "@/components/skeletons/RoomsSkeleton";
import { RoomsEmpty } from "@/components/rooms/RoomsEmpty";
import { RoomsList } from "@/components/rooms/RoomsList";
import type { Room } from "@/types";

export default function RoomsPage() {
  const { user, loading } = useAuth();
  const [myRooms, setMyRooms] = useState<(Room & { id: string })[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<(Room & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribeMyRooms = subscribeToMyRooms(user.uid, (rooms) => {
      setMyRooms(rooms);
      setIsLoading(false);
    });

    const unsubscribeJoinedRooms = subscribeToJoinedRooms(user.uid, (rooms) => {
      const filtered = rooms.filter((room) => room.createdBy !== user.uid);
      setJoinedRooms(filtered);
    });

    return () => {
      unsubscribeMyRooms();
      unsubscribeJoinedRooms();
    };
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4">Завантаження кімнат...</p>
        </div>
      </div>
    );
  }

  const hasNoRooms = myRooms.length === 0 && joinedRooms.length === 0;

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <RoomsHeader isCreateOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {isLoading ? (
        <>
          <section>
            <h2 className="text-2xl font-bold mb-4">Мої кімнати</h2>
            <RoomsSkeleton />
          </section>
        </>
      ) : hasNoRooms ? (
        <RoomsEmpty isCreateOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
      ) : (
        <RoomsList myRooms={myRooms} joinedRooms={joinedRooms} />
      )}
    </div>
  );
}
