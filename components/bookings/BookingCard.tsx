"use client"

import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog"
import { BookingForm } from "@/components/forms/BookingForm"
import type { Booking } from "@/types"

interface BookingCardProps {
  booking: Booking & { id: string }
  roomId: string
  isOwner: boolean
  isDeleting: boolean
  isUpdating: boolean
  onDelete: () => void
  onUpdate: (
    bookingId: string,
    title: string,
    description: string | undefined,
    startTime: Date,
    endTime: Date
  ) => Promise<void>
  isEditOpen: boolean
  isDeleteOpen: boolean
  onEditOpenChange: (open: boolean) => void
  onDeleteOpenChange: (open: boolean) => void
}

export function BookingCard({
  booking,
  roomId,
  isOwner,
  isDeleting,
  isUpdating,
  onDelete,
  onUpdate,
  isEditOpen,
  isDeleteOpen,
  onEditOpenChange,
  onDeleteOpenChange,
}: BookingCardProps) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{booking.title}</h3>
          {booking.description && (
            <p className="text-sm text-muted-foreground">{booking.description}</p>
          )}
        </div>
        {isOwner && (
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
              Ваше
            </div>
            <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  ✎
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Редагувати бронювання</DialogTitle>
                </DialogHeader>
                <BookingForm
                  roomId={roomId}
                  booking={booking}
                  onUpdate={onUpdate}
                  onSuccess={() => onEditOpenChange(false)}
                  onError={(error) => {
                    const msg = error instanceof Error ? error.message : "Помилка при оновленні";
                    if (msg.includes("Конфлікт бронювання")) {
                      toast.error("⚠️ " + msg, {
                        description: "Виберіть інший час",
                        duration: 5000,
                      });
                    } else {
                      toast.error("✕ " + msg);
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
            <ConfirmDialog
              open={isDeleteOpen}
              onOpenChange={onDeleteOpenChange}
              title="Видалити бронювання?"
              description={`"${booking.title}" буде видалено. Учасники більше не зможуть переглядати його.`}
              confirmText={isDeleting ? "Видалення..." : "Видалити"}
              onConfirm={onDelete}
              isLoading={isDeleting}
            >
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
              >
                ✕
              </Button>
            </ConfirmDialog>
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
            <span className="text-muted-foreground">Учасників:</span>
            <span>{booking.participants.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}
