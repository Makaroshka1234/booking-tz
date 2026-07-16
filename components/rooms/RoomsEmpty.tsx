"use client"

import { toast } from "sonner"
import { CreateDialog } from "@/components/dialogs/CreateDialog"
import { RoomForm } from "@/components/forms/RoomForm"

interface RoomsEmptyProps {
  isCreateOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function RoomsEmpty({ isCreateOpen, onOpenChange }: RoomsEmptyProps) {
  const handleRoomCreated = () => {
    toast.success("✓ Кімната успішно створена")
    onOpenChange(false)
  }

  return (
    <div className="state-empty">
      <div className="state-empty-icon">🏢</div>
      <h2 className="heading-4 mb-2">У вас поки немає кімнат</h2>
      <p className="text-caption mb-6">
        Створіть свою першу кімнату або попросіть у когось запрошення
      </p>
      <CreateDialog
        open={isCreateOpen}
        onOpenChange={onOpenChange}
        title="Створити нову кімнату"
        label="+ Створити першу кімнату"
        size="lg"
      >
        <RoomForm onSuccess={handleRoomCreated} />
      </CreateDialog>
    </div>
  )
}
