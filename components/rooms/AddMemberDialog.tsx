"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { addMember } from "@/lib/firestore/roomMembers"
import { fetchUsersPage } from "@/lib/firestore/users"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import type { User } from "@/types"

interface AddMemberDialogProps {
  roomId: string
  excludeUids?: string[]
  onSuccess?: () => void
}

interface UserWithUid extends User {
  uid: string
}

export function AddMemberDialog({
  roomId,
  excludeUids = [],
  onSuccess,
}: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithUid | null>(null)
  const [role, setRole] = useState<"admin" | "user">("user")
  const [searchValue, setSearchValue] = useState("")
  const [allUsers, setAllUsers] = useState<UserWithUid[]>([])
  const [cursor, setCursor] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Load initial users when dialog opens
  useEffect(() => {
    if (!isOpen) return

    const loadInitialUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const { users, nextCursor } = await fetchUsersPage()
        setAllUsers(users)
        setCursor(nextCursor)
        setHasMore(nextCursor !== null)
      } catch (error) {
        toast.error("✕ Помилка при завантаженні користувачів")
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadInitialUsers()
  }, [isOpen])

  // Intersection observer for pagination
  useEffect(() => {
    if (!popoverOpen || !sentinelRef.current || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return

        setIsLoadingMore(true)
        try {
          const { users: newUsers, nextCursor: newCursor } = await fetchUsersPage(
            cursor
          )
          setAllUsers((prev) => [...prev, ...newUsers])
          setCursor(newCursor)
          setHasMore(newCursor !== null)
        } catch (error) {
          toast.error("✕ Помилка при завантаженні більше користувачів")
        } finally {
          setIsLoadingMore(false)
        }
      },
      { rootMargin: "100px" }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [popoverOpen, cursor, hasMore, isLoadingMore])

  const filteredUsers = allUsers.filter((user) => {
    if (excludeUids.includes(user.uid)) return false
    if (!searchValue) return true
    return user.email.toLowerCase().includes(searchValue.toLowerCase())
  })

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast.error("✕ Виберіть користувача")
      return
    }

    setIsAdding(true)
    try {
      await addMember(roomId, selectedUser.uid, selectedUser.email, role)
      const roleLabel = role === "admin" ? "Адміністратор" : "Користувач"
      toast.success(`✓ Користувача успішно додано`, {
        description: `${selectedUser.email} • ${roleLabel}`,
      })
      setSelectedUser(null)
      setRole("user")
      setSearchValue("")
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
            <label className="text-sm font-medium mb-2 block">Користувач</label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isAdding || isLoadingUsers}
                >
                  {selectedUser ? (
                    <span>
                      {selectedUser.name} • {selectedUser.email}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Пошук користувача...
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="bottom" align="start">
                <Command>
                  <CommandInput
                    placeholder="Пошук за поштою..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                    disabled={isLoadingUsers}
                  />
                  <CommandList ref={listRef}>
                    {isLoadingUsers && filteredUsers.length === 0 ? (
                      <CommandEmpty>Завантаження...</CommandEmpty>
                    ) : filteredUsers.length === 0 ? (
                      <CommandEmpty>Нікого не знайдено</CommandEmpty>
                    ) : (
                      <>
                        {filteredUsers.map((user) => (
                          <CommandItem
                            key={user.uid}
                            value={user.uid}
                            onSelect={() => {
                              setSelectedUser(user)
                              setPopoverOpen(false)
                              setSearchValue("")
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                        {hasMore && (
                          <div ref={sentinelRef} className="h-px" />
                        )}
                        {isLoadingMore && (
                          <CommandEmpty>Завантаження більше...</CommandEmpty>
                        )}
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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

          <Button
            onClick={handleAddMember}
            className="w-full"
            disabled={isAdding || !selectedUser}
          >
            {isAdding ? "Додавання..." : "Додати"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
