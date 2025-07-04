"use client"

import { Avatar } from "@/components/ui/avatar"

interface UserProfileProps {
  name: string
  role: string
  avatarUrl?: string
}

export function UserProfile({ name, role, avatarUrl }: UserProfileProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="font-semibold">{name}</span>
        <span className="text-sm text-muted-foreground">{role}</span>
      </div>
      <Avatar src={avatarUrl} alt={name} fallback={name.charAt(0)} />
    </div>
  )
}

