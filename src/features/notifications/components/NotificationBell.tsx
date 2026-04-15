'use client'

import Link from 'next/link'
import { Bell, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  useInAppNotifications,
  useMarkAllInAppNotificationsRead,
  useMarkInAppNotificationRead,
} from '@/features/notifications/hooks/useNotifications'

function relativeTime(iso: string | undefined): string {
  if (iso == null || String(iso).trim() === '') return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

export function NotificationBell() {
  const { data: items, isLoading, isError } = useInAppNotifications()
  const markRead = useMarkInAppNotificationRead()
  const markAll = useMarkAllInAppNotificationsRead()
  const list = items ?? []
  const unread = list.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold text-primary-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,22rem)] p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {list.length > 0 && unread > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {markAll.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Mark all read'
              )}
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : isError ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Could not load notifications.
            </p>
          ) : list.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((n) => (
                <li key={n.id}>
                  <div
                    className={cn(
                      'flex gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
                      !n.read && 'bg-primary/[0.04]'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      {n.claimId != null && n.claimId > 0 ? (
                        <Link
                          href={`/dashboard/claims/${n.claimId}?from=all`}
                          className="block text-sm font-medium leading-snug text-foreground hover:underline"
                          onClick={() => {
                            if (!n.read) markRead.mutate(n.id)
                          }}
                        >
                          {n.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {n.title}
                        </p>
                      )}
                      {n.message ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.message}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.read ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground"
                        aria-label="Mark read"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(n.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
