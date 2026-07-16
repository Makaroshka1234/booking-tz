"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { deleteRoom } from "@/lib/firestore/rooms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { RoomForm } from "@/components/forms/RoomForm";
import type { Room } from "@/types";

interface RoomCardProps {
  room: Room & { id: string };
  isCreator: boolean;
  onDeleteSuccess?: () => void;
}

export function RoomCard({ room, isCreator, onDeleteSuccess }: RoomCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteRoom(room.id);
      toast.success("✓ Кімната успішно видалена");
      setIsDeleteAlertOpen(false);
      onDeleteSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "✕ Помилка при видаленні кімнати",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{room.name}</h3>
      <p className="text-muted-foreground text-sm mb-4">
        {room.description || "Без опису"}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link href={`/rooms/${room.id}`}>
          <Button variant="default" size="sm">
            Переглянути
          </Button>
        </Link>

        {isCreator && (
          <>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Редагувати
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редагувати кімнату</DialogTitle>
                </DialogHeader>
                <RoomForm
                  room={room}
                  onSuccess={() => {
                    toast.success("✓ Кімната успішно оновлена");
                    setIsEditOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>

            <ConfirmDialog
              open={isDeleteAlertOpen}
              onOpenChange={setIsDeleteAlertOpen}
              title="Видалити кімнату?"
              description="Ця дія необоротна. Будуть видалені кімната, всі бронювання та членство."
              confirmText={isDeleting ? "Видалення..." : "Видалити"}
              onConfirm={handleDelete}
              isLoading={isDeleting}
            >
              <Button variant="destructive" size="sm">
                Видалити
              </Button>
            </ConfirmDialog>
          </>
        )}
      </div>
    </div>
  );
}
