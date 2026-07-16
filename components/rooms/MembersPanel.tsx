"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { subscribeToMembers, removeMember } from "@/lib/firestore/roomMembers"
import { useAuth } from "@/hooks/useAuth"
import { useIncrementalReveal } from "@/hooks/useIncrementalReveal"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog"
import { AddMemberDialog } from "@/components/rooms/AddMemberDialog"
import type { RoomMember } from "@/types"

interface MembersPanelProps {
  roomId: string
  createdBy: string
}

export function MembersPanel({ roomId, createdBy }: MembersPanelProps) {
  const [members, setMembers] = useState<RoomMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = subscribeToMembers(roomId, (updatedMembers) => {
      setMembers(updatedMembers)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [roomId])

  async function handleRemoveMember(memberId: string, memberUid: string, memberEmail: string) {
    setRemovingId(memberId)
    try {
      await removeMember(roomId, memberUid)
      toast.success("✓ Учасник успішно видалений", {
        description: memberEmail,
      })
      setDeleteAlertOpen(null)
    } catch (error) {
      toast.error(
        error instanceof Error ? `✕ ${error.message}` : "✕ Помилка при видаленні учасника"
      )
    } finally {
      setRemovingId(null)
    }
  }

  const isCreator = user?.uid === createdBy
  const { visibleCount, containerRef, sentinelRef, hasMore } = useIncrementalReveal({
    total: members.length,
    pageSize: 5,
  })

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Завантаження учасників...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg sm:text-xl font-semibold">Учасники кімнати</h2>
        {isCreator && <AddMemberDialog roomId={roomId} />}
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            Учасників немає. Тільки ви можете переглядати цю кімнату.
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="max-h-96 overflow-y-auto pr-1 bg-white dark:bg-slate-950 rounded-lg">
          <div className="space-y-2">
            {members.slice(0, visibleCount).map((member) => (
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
                  <ConfirmDialog
                    open={deleteAlertOpen === member.id}
                    onOpenChange={(open) => {
                      if (!open) setDeleteAlertOpen(null)
                    }}
                    title="Видалити учасника?"
                    description={`${member.email} буде видален з цієї кімнати. Він не зможе переглядати бронювання.`}
                    confirmText={removingId === member.id ? "Видалення..." : "Видалити"}
                    onConfirm={() => handleRemoveMember(member.id, member.uid, member.email)}
                    isLoading={removingId === member.id}
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteAlertOpen(member.id)}
                    >
                      Видалити
                    </Button>
                  </ConfirmDialog>
                )}
              </div>
            ))}
          </div>
          {hasMore && <div ref={sentinelRef} className="h-px" />}
        </div>
      )}
    </div>
  )
}
