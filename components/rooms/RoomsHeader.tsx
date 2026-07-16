"use client";

import { toast } from "sonner";
import { CreateDialog } from "@/components/dialogs/CreateDialog";
import { RoomForm } from "@/components/forms/RoomForm";

interface RoomsHeaderProps {
  isCreateOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomsHeader({ isCreateOpen, onOpenChange }: RoomsHeaderProps) {
  const handleRoomCreated = () => {
    toast.success("✓ Кімната успішно створена");
    onOpenChange(false);
  };

  return (
    <section className="section-header flex">
      <h1 className="section-title">Кімнати</h1>
      <CreateDialog
        open={isCreateOpen}
        onOpenChange={onOpenChange}
        title="Створити нову кімнату"
        label="+ Створити кімнату"
      >
        <RoomForm onSuccess={handleRoomCreated} />
      </CreateDialog>
    </section>
  );
}
