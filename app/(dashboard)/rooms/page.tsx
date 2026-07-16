"use client";

import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useRooms } from "@/hooks/useRooms";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { RoomsEmpty } from "@/components/rooms/RoomsEmpty";
import { RoomsList } from "@/components/rooms/RoomsList";

export default function RoomsPage() {
  const { user, loading } = useAuth();
  const { myRooms, joinedRooms, isLoading } = useRooms(user?.uid);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

      {hasNoRooms ? (
        <RoomsEmpty isCreateOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
      ) : (
        <RoomsList myRooms={myRooms} joinedRooms={joinedRooms} />
      )}
    </div>
  );
}
