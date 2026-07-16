"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"

import { registerUser, getAuthErrorMessage } from "@/lib/auth"
import { registerSchema, type RegisterFormValues } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FormBase } from "./FormBase"

export function RegisterForm() {
  const router = useRouter()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    await registerUser(values.name, values.email, values.password)
    toast.success("Реєстрація успішна! Переспрямовування...")
    router.push("/rooms")
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold tracking-tight">Реєстрація</h1>
        <p className="text-xs text-muted-foreground">
          Створіть новий акаунт для вхідної планування
        </p>
      </div>

      <FormBase
        form={form}
        onSubmit={onSubmit}
        submitLabel="Зареєструватися"
        loadingLabel="Реєстрація..."
        getErrorMessage={getAuthErrorMessage}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ім'я</FormLabel>
              <FormControl>
                <Input placeholder="Ваше ім'я" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormBase>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Вже маєте акаунт? </span>
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Вхід
        </Link>
      </div>
    </div>
  )
}
