"use client"

import { useState } from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

interface FormBaseProps<T extends FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (values: T) => Promise<void>
  submitLabel: string
  loadingLabel?: string
  getErrorMessage?: (error: unknown) => string
  onError?: (error: unknown) => void
  className?: string
  children: React.ReactNode
}

export function FormBase<T extends FieldValues>({
  form,
  onSubmit,
  submitLabel,
  loadingLabel,
  getErrorMessage = (error) =>
    error instanceof Error ? error.message : "Сталася помилка",
  onError,
  className = "space-y-4",
  children,
}: FormBaseProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(values: T) {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      onError ? onError(error) : toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        {children}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (loadingLabel ?? submitLabel) : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
