"use client"

import { useState } from "react"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Calendar as CalendarIcon } from "lucide-react"

import { createBooking } from "@/lib/firestore/bookings"
import { bookingSchema, type BookingFormValues } from "@/lib/validators"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Generate time slots every 30 minutes
function generateTimeSlots(): { label: string; value: string }[] {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let min of [0, 30]) {
      const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
      slots.push({
        label: timeStr,
        value: timeStr,
      })
    }
  }
  return slots
}

const timeSlots = generateTimeSlots()

interface BookingFormProps {
  roomId: string
  onSuccess?: () => void
}

export function BookingForm({ roomId, onSuccess }: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: "",
      description: "",
      date: undefined,
      startTime: "09:00",
      endTime: "10:00",
    },
  })

  async function onSubmit(values: BookingFormValues) {
    if (!user) {
      toast.error("Ви не авторизовані")
      return
    }

    setIsLoading(true)
    try {
      const [startHour, startMin] = values.startTime.split(":").map(Number)
      const [endHour, endMin] = values.endTime.split(":").map(Number)

      const startTime = new Date(values.date)
      startTime.setHours(startHour, startMin, 0, 0)

      const endTime = new Date(values.date)
      endTime.setHours(endHour, endMin, 0, 0)

      await createBooking(
        roomId,
        values.title,
        values.description,
        startTime,
        endTime,
        user.uid
      )
      toast.success("Бронювання створене")
      form.reset()
      onSuccess?.()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Сталася помилка"

      // Check if this is a conflict error
      if (errorMsg.includes("Конфлікт бронювання")) {
        toast.error(errorMsg, {
          description:
            "Виберіть інший час для бронювання цієї кімнати",
          duration: 5000,
        })
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Час початку</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-64">
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Час завершення</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-64">
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Створення..." : "Створити бронювання"}
        </Button>
      </form>
    </Form>
  )
}
