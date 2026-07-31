'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MessageSquare, Search, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChatBubble } from '@/components/shared/chat-bubble'
import { TypingIndicator } from '@/components/shared/typing-indicator'
import { PresenceIndicator } from '@/components/shared/presence-indicator'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { createClient } from '@/lib/supabase/client'
import { cn, initials, relativeTime, sanitizeText } from '@/lib/utils'
import type { Profile } from '@/types/database'

function MessagesInner() {
  const params = useSearchParams()
  const profile = useAuthStore((s) => s.profile)
  const students = useDataStore((s) => s.students)
  const messages = useDataStore((s) => s.messages)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)

  const [activeId, setActiveId] = useState<string | null>(params.get('to'))
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [peerTyping, setPeerTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>()

  const contacts = useMemo(
    () => students.filter((s) => s.role === 'student' && s.id !== profile?.id),
    [students, profile?.id]
  )

  const lastMessageFor = useCallback(
    (id: string) =>
      messages
        .filter((m) => (m.sender_id === id && m.receiver_id === profile?.id) || (m.sender_id === profile?.id && m.receiver_id === id))
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0],
    [messages, profile?.id]
  )

  const unreadFrom = useCallback(
    (id: string) => messages.filter((m) => m.sender_id === id && m.receiver_id === profile?.id && !m.is_read).length,
    [messages, profile?.id]
  )

  const sortedContacts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contacts
      .filter((c) => !q || c.full_name.toLowerCase().includes(q))
      .sort((a, b) => {
        const la = lastMessageFor(a.id)
        const lb = lastMessageFor(b.id)
        if (la && lb) return +new Date(lb.created_at) - +new Date(la.created_at)
        if (la) return -1
        if (lb) return 1
        return a.full_name.localeCompare(b.full_name)
      })
  }, [contacts, query, lastMessageFor])

  const active: Profile | null = useMemo(() => contacts.find((c) => c.id === activeId) ?? null, [contacts, activeId])

  const thread = useMemo(
    () =>
      messages
        .filter(
          (m) =>
            (m.sender_id === activeId && m.receiver_id === profile?.id) ||
            (m.sender_id === profile?.id && m.receiver_id === activeId)
        )
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [messages, activeId, profile?.id]
  )

  const onlineUsers = useMemo(() => contacts.slice(0, 6).map((c) => ({ id: c.id, full_name: c.full_name, avatar_url: c.avatar_url })), [contacts])

  // Mark thread as read
  useEffect(() => {
    if (!activeId || !profile) return
    messages
      .filter((m) => m.sender_id === activeId && m.receiver_id === profile.id && !m.is_read)
      .forEach((m) => update('messages', m.id, { is_read: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread.length, peerTyping])

  // ---- Supabase Realtime: messages + typing broadcast ----
  useEffect(() => {
    const supabase = createClient()
    if (!supabase || !profile) return

    const channel = supabase
      .channel(`chat:${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${profile.id}` }, (payload) => {
        add('messages', payload.new as any)
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.from && payload.from === activeId) {
          setPeerTyping(true)
          clearTimeout(typingTimer.current)
          typingTimer.current = setTimeout(() => setPeerTyping(false), 2200)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, activeId])

  const broadcastTyping = () => {
    const supabase = createClient()
    if (!supabase || !activeId || !profile) return
    supabase.channel(`chat:${activeId}`).send({ type: 'broadcast', event: 'typing', payload: { from: profile.id } })
  }

  function send(e: React.FormEvent) {
    e.preventDefault()
    const content = sanitizeText(text, 1500)
    if (!content || !activeId || !profile) return

    add('messages', {
      id: uid(),
      sender_id: profile.id,
      receiver_id: activeId,
      content,
      is_read: false,
      created_at: nowIso(),
    })
    setText('')

    // Demo mode: simulate a reply with typing indicator.
    if (!createClient()) {
      setTimeout(() => setPeerTyping(true), 900)
      setTimeout(() => {
        setPeerTyping(false)
        const replies = ['Oke, siap! 👍', 'Wah makasih infonya', 'Nanti aku cek ya', 'Iya bener banget', 'Sip, ketemu besok di kelas']
        add('messages', {
          id: uid(),
          sender_id: activeId,
          receiver_id: profile.id,
          content: replies[Math.floor(Math.random() * replies.length)],
          is_read: true,
          created_at: nowIso(),
        })
      }, 2800)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col lg:h-[calc(100dvh-3rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">Chat real-time dengan teman sekelas.</p>
        </div>
        <PresenceIndicator users={onlineUsers} />
      </div>

      <Card glass className="flex min-h-0 flex-1 overflow-hidden p-0">
        {/* Contacts */}
        <div className={cn('flex w-full min-w-0 flex-col border-r border-border/60 sm:w-72 lg:w-80', active && 'hidden sm:flex')}>
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari teman..." className="h-9 pl-9" aria-label="Cari kontak" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {sortedContacts.map((c) => {
              const last = lastMessageFor(c.id)
              const unread = unreadFrom(c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-border/40 px-3 py-3 text-left transition-colors hover:bg-accent/50',
                    activeId === c.id && 'bg-primary/10'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      {c.avatar_url && <AvatarImage src={c.avatar_url} alt={c.full_name} />}
                      <AvatarFallback className="text-xs">{initials(c.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.full_name.split(' ').slice(0, 2).join(' ')}</p>
                      {last && <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(last.created_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">{last?.content ?? 'Mulai percakapan'}</p>
                      {unread > 0 && <Badge className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px]">{unread}</Badge>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat window */}
        <div className={cn('flex min-w-0 flex-1 flex-col', !active && 'hidden sm:flex')}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
                <Button variant="ghost" size="icon-sm" className="sm:hidden" onClick={() => setActiveId(null)} aria-label="Kembali">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  {active.avatar_url && <AvatarImage src={active.avatar_url} alt={active.full_name} />}
                  <AvatarFallback className="text-xs">{initials(active.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{active.full_name}</p>
                  <p className="text-[11px] text-emerald-500">{peerTyping ? 'sedang mengetik...' : 'online'}</p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-4 scrollbar-thin">
                {thread.length === 0 && (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <MessageSquare className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Belum ada pesan. Sapa {active.full_name.split(' ')[0]}!</p>
                    </div>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {thread.map((m) => (
                    <ChatBubble
                      key={m.id}
                      content={m.content}
                      isOwn={m.sender_id === profile?.id}
                      time={m.created_at}
                      isRead={m.is_read}
                    />
                  ))}
                </AnimatePresence>
                <TypingIndicator name={active.full_name.split(' ')[0]} visible={peerTyping} />
              </div>

              <form onSubmit={send} className="flex items-center gap-2 border-t border-border/60 p-3">
                <Input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    broadcastTyping()
                  }}
                  placeholder="Tulis pesan..."
                  maxLength={1500}
                  aria-label="Tulis pesan"
                  className="flex-1"
                />
                <Button type="submit" variant="gradient" size="icon" disabled={!text.trim()} aria-label="Kirim pesan">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="hidden flex-1 place-items-center sm:grid">
              <EmptyState icon={MessageSquare} title="Pilih percakapan" description="Pilih teman di daftar kiri untuk mulai chat." className="border-0" />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-64 skeleton" />}>
      <MessagesInner />
    </Suspense>
  )
}
