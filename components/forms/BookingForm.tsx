"use client"

import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar as CalendarIcon } from "lucide-react"

import { createBooking, updateBooking } from "@/lib/firestore/bookings"
import { bookingSchema, type BookingFormValues } from "@/lib/validators"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FormBase } from "./FormBase"
import { TimeSelectField } from "./TimeSelectField"
import type { Booking } from "@/types"

interface BookingFormProps {
  roomId: string
  booking?: Booking & { id: string }
  onSuccess?: () => void
  onError?: (error: unknown) => void
  onUpdate?: (
    bookingId: string,
    title: string,
    description: string | undefined,
    startTime: Date,
    endTime: Date
  ) => Promise<void>
}

export function BookingForm({
  roomId,
  booking,
  onSuccess,
  onError,
  onUpdate
}: BookingFormProps) {
  const { user } = useAuth()

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: booking?.title || "",
      description: booking?.description || "",
      date: booking?.startTime?.toDate?.() || undefined,
      startTime: booking?.startTime?.toDate?.()?.toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit"
      }) || "09:00",
      endTime: booking?.endTime?.toDate?.()?.toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit"
      }) || "10:00",
    },
  })

  async function onSubmit(values: BookingFormValues) {
    if (!user) {
      throw new Error("Ви не авторизовані")
    }

    const [startHour, startMin] = values.startTime.split(":").map(Number)
    const [endHour, endMin] = values.endTime.split(":").map(Number)

    const startTime = new Date(values.date)
    startTime.setHours(startHour, startMin, 0, 0)

    const endTime = new Date(values.date)
    endTime.setHours(endHour, endMin, 0, 0)

    if (booking?.id && onUpdate) {
      await onUpdate(
        booking.id,
        values.title,
        values.description,
        startTime,
        endTime
      )
    } else {
      await createBooking(
        roomId,
        values.title,
        values.description,
        startTime,
        endTime,
        user.uid
      )
    }
    form.reset()
    onSuccess?.()
  }

  return (
    <FormBase
      form={form}
      onSubmit={onSubmit}
      submitLabel={booking ? "Оновити бронювання" : "Створити бронювання"}
      loadingLabel={booking ? "Оновлення..." : "Створення..."}
      onError={onError}
      className="space-y-4"
    >
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Назва бронювання</FormLabel>
            <FormControl>
              <Input placeholder="Назва (наприклад: Зустріч із командою)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Опис (опціонально)</FormLabel>
            <FormControl>
              <Input placeholder="Деталі або тема зустрічі" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Дата</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "d MMMM yyyy", { locale: uk })
                    ) : (
                      <span>Виберіть дату</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TimeSelectField form={form} name="startTime" label="Час початку" />
        <TimeSelectField form={form} name="endTime" label="Час завершення" />
      </div>
    </FormBase>
  )
}
