"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { createRoom, updateRoom } from "@/lib/firestore/rooms"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FormBase } from "./FormBase"
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
      throw new Error("Ви не авторизовані")
    }

    if (room?.id) {
      await updateRoom(room.id, values.name, values.description)
    } else {
      await createRoom(values.name, values.description, user.uid)
    }
    form.reset()
    onSuccess?.()
  }

  return (
    <FormBase
      form={form}
      onSubmit={onSubmit}
      submitLabel={room ? "Оновити кімнату" : "Створити кімнату"}
      loadingLabel="Збереження..."
      className="space-y-4"
    >
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
    </FormBase>
  )
}
