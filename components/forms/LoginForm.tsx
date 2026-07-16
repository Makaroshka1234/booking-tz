"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"

import { loginUser, getAuthErrorMessage } from "@/lib/auth"
import { loginSchema, type LoginFormValues } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FormBase } from "./FormBase"

export function LoginForm() {
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    await loginUser(values.email, values.password)
    toast.success("Вхід успішний! Переспрямовування...")
    router.push("/rooms")
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold tracking-tight">Вхід</h1>
        <p className="text-xs text-muted-foreground">
          Увійдіть до свого акаунту для планування
        </p>
      </div>

      <FormBase
        form={form}
        onSubmit={onSubmit}
        submitLabel="Увійти"
        loadingLabel="Вхід..."
        getErrorMessage={getAuthErrorMessage}
        className="space-y-4"
      >
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
        <span className="text-muted-foreground">Немаєте акаунту? </span>
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline"
        >
          Зареєструватися
        </Link>
      </div>
    </div>
  )
}
