"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { createRoom, updateRoom } from "@/lib/firestore/rooms"
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
import type { Room } from "@/types"

const roomSchema = z.object({
  name: z.string().min(2, "Назва має містити щонайменше 2 символи"),
  description: z.string().min(5, "Опис має містити щонайменше 5 символів"),
})

type RoomFormValues = z.infer<typeof roomSchema>

interface RoomFormProps {
  room?: Room & { id: string }
  onSuccess?: () => void
}

export function RoomForm({ room, onSuccess }: RoomFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room?.name || "",
      description: room?.description || "",
    },
  })

  async function onSubmit(values: RoomFormValues) {
    if (!user) {
      toast.error("Ви не авторизовані")
      return
    }

    setIsLoading(true)
    try {
      if (room?.id) {
        await updateRoom(room.id, values.name, values.description)
        toast.success("Кімната оновлена")
      } else {
        await createRoom(values.name, values.description, user.uid)
        toast.success("Кімната створена")
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Сталася помилка"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Назва кімнати</FormLabel>
              <FormControl>
                <Input placeholder="Назва кімнати" {...field} />
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
              <FormLabel>Опис</FormLabel>
              <FormControl>
                <Input placeholder="Опис кімнати (місткість, обладнання тощо)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Збереження..." : room ? "Оновити кімнату" : "Створити кімнату"}
        </Button>
      </form>
    </Form>
  )
}
