'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { initials } from '@/lib/utils'

export interface PresenceUser { id: string; full_name: string; avatar_url: string | null }

export function PresenceIndicator({ users, max = 5 }: { users: PresenceUser[]; max?: number }) {
  const shown = users.slice(0, max)
  const rest = users.length - shown.length

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <div className="flex -space-x-2">
        <TooltipProvider delayDuration={150}>
          {shown.map((u) => (
            <Tooltip key={u.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background">
                  {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.full_name} />}
                  <AvatarFallback className="text-[10px]">{initials(u.full_name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{u.full_name}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        {rest > 0 && (
          <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold">
            +{rest}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{users.length} online</span>
    </div>
  )
}
