"use client"

import { useState } from "react"
import { toast } from "sonner"
import { addMemberByEmail } from "@/lib/firestore/roomMembers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AddMemberDialogProps {
  roomId: string
  onSuccess?: () => void
}

export function AddMemberDialog({ roomId, onSuccess }: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "user">("user")

  const handleAddMember = async () => {
    if (!email.trim()) {
      toast.error("✕ Введіть email користувача")
      return
    }

    setIsAdding(true)
    try {
      await addMemberByEmail(roomId, email.trim(), role)
      const roleLabel = role === "admin" ? "Адміністратор" : "Користувач"
      toast.success(`✓ Користувача успішно додано`, {
        description: `${email.trim()} • ${roleLabel}`,
      })
      setEmail("")
      setRole("user")
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? `✕ ${error.message}` : "✕ Помилка при додаванні користувача"
      )
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Додати учасника</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Додати учасника</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Email користувача</label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAdding}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Роль</label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "admin" | "user")}
              disabled={isAdding}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Користувач</SelectItem>
                <SelectItem value="admin">Адміністратор</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAddMember} className="w-full" disabled={isAdding}>
            {isAdding ? "Додавання..." : "Додати"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
