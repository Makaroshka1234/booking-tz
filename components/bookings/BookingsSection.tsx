"use client";

import { toast } from "sonner";
import { BookingForm } from "@/components/forms/BookingForm";
import { BookingCard } from "@/components/bookings/BookingCard";
import { CreateDialog } from "@/components/dialogs/CreateDialog";
import { useIncrementalReveal } from "@/hooks/useIncrementalReveal";
import type { Booking } from "@/types";

interface BookingsSectionProps {
  roomId: string;
  bookings: (Booking & { id: string })[];
  userId?: string;
  isCreateOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  editingId: string | null;
  deletingId: string | null;
  onEditingChange: (id: string | null) => void;
  onDeletingChange: (id: string | null) => void;
  onDelete: (bookingId: string) => void;
  onUpdate: (
    bookingId: string,
    title: string,
    description: string | undefined,
    startTime: Date,
    endTime: Date,
  ) => Promise<void>;
}

export function BookingsSection({
  roomId,
  bookings,
  userId,
  isCreateOpen,
  onCreateOpenChange,
  editingId,
  deletingId,
  onEditingChange,
  onDeletingChange,
  onDelete,
  onUpdate,
}: BookingsSectionProps) {
  const isEmpty = bookings.length === 0;
  const { visibleCount, containerRef, sentinelRef, hasMore } =
    useIncrementalReveal({
      total: bookings.length,
      pageSize: 5,
    });

  const handleBookingError = (error: unknown) => {
    const msg = error instanceof Error ? error.message : "Помилка при створенні бронювання";
    if (msg.includes("Конфлікт бронювання")) {
      toast.error("⚠️ " + msg, {
        description: "Виберіть інший час",
        duration: 5000,
      });
    } else {
      toast.error("✕ " + msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Бронювання</h2>
        <CreateDialog
          open={isCreateOpen}
          onOpenChange={onCreateOpenChange}
          title="Створити нове бронювання"
          label="+ Створити бронювання"
        >
          <BookingForm
            roomId={roomId}
            onSuccess={() => onCreateOpenChange(false)}
            onError={handleBookingError}
          />
        </CreateDialog>
      </div>

      {isEmpty ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold mb-2">Бронювань не знайдено</h3>
          <p className="text-muted-foreground mb-6">
            Будьте першими, хто забронює цю кімнату
          </p>
          <CreateDialog
            open={isCreateOpen}
            onOpenChange={onCreateOpenChange}
            title="Створити нове бронювання"
            label="+ Створити бронювання"
            size="lg"
          >
            <BookingForm
              roomId={roomId}
              onSuccess={() => onCreateOpenChange(false)}
              onError={handleBookingError}
            />
          </CreateDialog>
        </div>
      ) : (
        <div ref={containerRef} className="max-h-90 overflow-y-auto pr-1 bg-white dark:bg-slate-950 rounded-lg">
          <div className="grid gap-4">
            {bookings.slice(0, visibleCount).map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                roomId={roomId}
                isOwner={booking.createdBy === userId}
                isDeleting={deletingId === booking.id}
                isUpdating={editingId === booking.id}
                onDelete={() => onDelete(booking.id)}
                onUpdate={onUpdate}
                isEditOpen={editingId === booking.id}
                isDeleteOpen={deletingId === booking.id}
                onEditOpenChange={(open) =>
                  onEditingChange(open ? booking.id : null)
                }
                onDeleteOpenChange={(open) =>
                  onDeletingChange(open ? booking.id : null)
                }
              />
            ))}
          </div>
          {hasMore && <div ref={sentinelRef} className="h-px" />}
        </div>
      )}
    </div>
  );
}
