"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { addMember } from "@/lib/firestore/roomMembers";
import { fetchUsersPage } from "@/lib/firestore/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { User } from "@/types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

interface AddMemberDialogProps {
  roomId: string;
  excludeUids?: string[];
  onSuccess?: () => void;
}

interface UserWithUid extends User {
  uid: string;
}

export function AddMemberDialog({
  roomId,
  excludeUids = [],
  onSuccess,
}: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithUid | null>(null);
  const [role, setRole] = useState<"admin" | "user">("user");
  const [searchValue, setSearchValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserWithUid[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadInitialUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const { users, nextCursor } = await fetchUsersPage();
        setAllUsers(users);
        setCursor(nextCursor);
        setHasMore(nextCursor !== null);
      } catch {
        toast.error("✕ Помилка при завантаженні користувачів");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadInitialUsers();
  }, [isOpen]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedUser(null);
      setRole("user");
      setSearchValue("");
      setDropdownOpen(false);
      setAllUsers([]);
      setCursor(null);
      setHasMore(true);
    }
  };

  useEffect(() => {
    if (!dropdownOpen || !hasMore || isLoadingMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return;

        setIsLoadingMore(true);
        try {
          const { users: newUsers, nextCursor } = await fetchUsersPage(
            cursor ?? undefined,
          );
          setAllUsers((prev) => [...prev, ...newUsers]);
          setCursor(nextCursor);
          setHasMore(nextCursor !== null);
        } catch {
          toast.error("✕ Помилка при завантаженні більше користувачів");
        } finally {
          setIsLoadingMore(false);
        }
      },
      { rootMargin: "100px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [dropdownOpen, cursor, hasMore, isLoadingMore]);

  const filteredUsers = allUsers.filter((user) => {
    if (excludeUids.includes(user.uid)) return false;
    if (!searchValue) return true;
    return user.email.toLowerCase().includes(searchValue.toLowerCase());
  });

  const handleSelectUser = (user: UserWithUid) => {
    setSelectedUser(user);
    setSearchValue("");
    setDropdownOpen(false);
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setIsAdding(true);
    try {
      await addMember(roomId, selectedUser.uid, selectedUser.email, role);
      const roleLabel = role === "admin" ? "Адміністратор" : "Користувач";
      toast.success(`✓ Користувача успішно додано`, {
        description: `${selectedUser.email} • ${roleLabel}`,
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `✕ ${error.message}`
          : "✕ Помилка при додаванні користувача",
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">+ Додати учасника</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Додати учасника</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <label className="text-sm font-medium mb-2 block">Користувач</label>

            {selectedUser && !dropdownOpen ? (
              <button
                type="button"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left"
                onClick={() => setDropdownOpen(true)}
                disabled={isAdding}
              >
                <span className="truncate">{selectedUser.email}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  Змінити
                </span>
              </button>
            ) : (
              <Input
                placeholder="Пошук за поштою..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setDropdownOpen(false)}
                disabled={isAdding || isLoadingUsers}
                autoComplete="off"
              />
            )}

            {dropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-h-30 overflow-y-auto rounded-md border border-input bg-white shadow-md">
                {isLoadingUsers ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Завантаження...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Нікого не знайдено
                  </div>
                ) : (
                  <>
                    {filteredUsers.map((user) => (
                      <div
                        key={user.uid}
                        role="option"
                        aria-selected={selectedUser?.uid === user.uid}
                        tabIndex={-1}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={() => handleSelectUser(user)}
                        className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                      >
                        <div className="font-medium text-sm text-foreground">
                          {user.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.name}
                        </div>
                      </div>
                    ))}
                    {hasMore && <div ref={sentinelRef} className="h-px" />}
                    {isLoadingMore && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Завантаження більше...
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
  );
}
