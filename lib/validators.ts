import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().min(2, "Ім'я має містити щонайменше 2 символи"),
  email: z.string().trim().email("Невірний формат email"),
  password: z.string().min(6, "Пароль має містити щонайменше 6 символів"),
})

export const loginSchema = z.object({
  email: z.string().trim().email("Невірний формат email"),
  password: z.string().min(6, "Пароль має містити щонайменше 6 символів"),
})

export const bookingSchema = z
  .object({
    title: z.string().min(2, "Назва має містити щонайменше 2 символи"),
    description: z.string().optional(),
    date: z.date({ message: "Виберіть дату" }),
    startTime: z.string().min(1, "Виберіть час початку"),
    endTime: z.string().min(1, "Виберіть час завершення"),
  })
  .refine(
    (data) => {
      const [startHour, startMin] = data.startTime.split(":").map(Number)
      const [endHour, endMin] = data.endTime.split(":").map(Number)
      const startTotalMin = startHour * 60 + startMin
      const endTotalMin = endHour * 60 + endMin
      return startTotalMin < endTotalMin
    },
    {
      message: "Час завершення має бути пізніше за час початку",
      path: ["endTime"],
    }
  )

export type RegisterFormValues = z.infer<typeof registerSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type BookingFormValues = z.infer<typeof bookingSchema>
