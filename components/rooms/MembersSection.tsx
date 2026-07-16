"use client"

import { MembersPanel } from "@/components/rooms/MembersPanel"

interface MembersSectionProps {
  roomId: string
  createdBy: string
}

export function MembersSection({ roomId, createdBy }: MembersSectionProps) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <MembersPanel roomId={roomId} createdBy={createdBy} />
    </div>
  )
}
