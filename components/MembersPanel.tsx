"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  subscribeToMembers,
  addMemberByEmail,
  removeMember,
} from "@/lib/firestore/roomMembers"
import { useAuth } from "@/hooks/useAuth"
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
import type { RoomMember } from "@/types"

interface MembersPanelProps {
  roomId: string
  createdBy: string
}

export function MembersPanel({ roomId, createdBy }: MembersPanelProps) {
  const [members, setMembers] = useState<RoomMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "user">("user")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = subscribeToMembers(roomId, (updatedMembers) => {
      setMembers(updatedMembers)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [roomId])

  async function handleAddMember() {
    if (!newMemberEmail.trim()) {
      toast.error("Введіть email")
      return
    }

    setIsAddingMember(true)
    try {
      await addMemberByEmail(roomId, newMemberEmail.trim(), newMemberRole)
      toast.success(`Користувача додано з роллю "${newMemberRole}"`)
      setNewMemberEmail("")
      setNewMemberRole("user")
      setIsDialogOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Помилка додавання користувача"
      )
    } finally {
      setIsAddingMember(false)
    }
  }

  async function handleRemoveMember(memberId: string, memberUid: string) {
    if (!confirm("Ви впевнені що хочете видалити цього учасника?")) {
      return
    }

    setRemovingId(memberId)
    try {
      await removeMember(roomId, memberUid)
      toast.success("Учасник видалений")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Помилка видалення"
      )
    } finally {
      setRemovingId(null)
    }
  }

  const isCreator = user?.uid === createdBy

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Завантаження учасників...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Учасники кімнати</h2>
        {isCreator && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">+ Додати учасника</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Додати учасника</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Email користувача
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    disabled={isAddingMember}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Роль
                  </label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(value) =>
                      setNewMemberRole(value as "admin" | "user")
                    }
                    disabled={isAddingMember}
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

                <Button
                  onClick={handleAddMember}
                  className="w-full"
                  disabled={isAddingMember}
                >
                  {isAddingMember ? "Додавання..." : "Додати"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            Учасників немає. Тільки ви можете переглядати цю кімнату.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent/50 transition"
            >
              <div>
                <div className="font-medium">{member.email}</div>
                <div className="text-xs text-muted-foreground">
                  {member.role === "admin" ? "Адміністратор" : "Користувач"}
                </div>
              </div>

              {isCreator && member.uid !== user?.uid && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id, member.uid)}
                  disabled={removingId === member.id}
                >
                  {removingId === member.id ? "Видалення..." : "Видалити"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
