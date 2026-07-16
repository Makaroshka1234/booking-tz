"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"

interface CreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  label?: string
  size?: "default" | "sm" | "lg"
  variant?: VariantProps<typeof buttonVariants>["variant"]
  className?: string
  children: React.ReactNode
}

export function CreateDialog({
  open,
  onOpenChange,
  title,
  label = "+ Створити",
  size = "default",
  variant = "default",
  className,
  children,
}: CreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={className}>{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

