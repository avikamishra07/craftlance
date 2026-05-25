import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, X, Loader2 } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import type { Message } from '@/types'
import { useAuthStore } from '@/store/authStore'

interface MessageThreadProps {
  messages: Message[]
  contractId: string
  onSend: (content: string, fileUrls?: string[]) => Promise<void>
  loading?: boolean
}

function Avatar({ name, url, size = 7 }: { name: string; url?: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0 object-cover`
  if (url) return <img src={url} alt={name} className={cls} />
  return (
    <div className={cn(cls, 'bg-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-300')}>
      {name[0]?.toUpperCase()}
    </div>
  )
}

// Group consecutive messages from same sender
function groupMessages(messages: Message[]) {
  const groups: { sender_id: string; messages: Message[] }[] = []
  for (const m of messages) {
    const last = groups[groups.length - 1]
    if (last && last.sender_id === m.sender_id) {
      last.messages.push(m)
    } else {
      groups.push({ sender_id: m.sender_id, messages: [m] })
    }
  }
  return groups
}

export function MessageThread({ messages, contractId, onSend, loading = false }: MessageThreadProps) {
  const { user } = useAuthStore()
  const [input, setInput]         = useState('')
  const [fileInput, setFileInput] = useState('')
  const [showFile, setShowFile]   = useState(false)
  const [sending, setSending]     = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textRef   = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 120)}px` }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const urls = fileInput.trim()
        ? fileInput.split(',').map((u) => u.trim()).filter(Boolean)
        : undefined
      await onSend(input.trim(), urls)
      setInput('')
      setFileInput('')
      setShowFile(false)
    } finally {
      setSending(false)
    }
  }

  const groups = groupMessages(messages)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 py-3 space-y-4 scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center h-full py-10">
            <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-10">
            <p className="text-sm text-muted-foreground">No messages yet — say hello!</p>
          </div>
        ) : (
          groups.map((group) => {
            const isMine = group.sender_id === user?.id
            const first  = group.messages[0]
            const sender = first.sender

            return (
              <div key={first.id} className={cn('flex gap-2.5', isMine && 'flex-row-reverse')}>
                {/* Avatar — only on first message in group */}
                <Avatar
                  name={sender?.full_name ?? (isMine ? user?.full_name ?? 'Me' : '?')}
                  url={sender?.avatar_url}
                />

                {/* Bubble stack */}
                <div className={cn('flex flex-col gap-1 max-w-[72%]', isMine && 'items-end')}>
                  {!isMine && (
                    <p className="text-[10px] text-muted-foreground px-1">
                      {sender?.full_name ?? 'Unknown'}
                    </p>
                  )}
                  {group.messages.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15, delay: i * 0.03 }}
                    >
                      <div className={cn(
                        'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isMine
                          ? 'bg-brand-600/30 text-white rounded-br-sm border border-brand-500/20'
                          : 'bg-surface-3 text-foreground rounded-bl-sm border border-white/[0.06]',
                      )}>
                        {m.content}
                        {m.file_urls && m.file_urls.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {m.file_urls.map((url) => (
                              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-brand-400 hover:underline">
                                <Paperclip className="h-3 w-3" />
                                {url.split('/').pop() ?? url}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {i === group.messages.length - 1 && (
                        <p className={cn('text-[10px] text-muted-foreground mt-0.5 px-1', isMine && 'text-right')}>
                          {timeAgo(m.sent_at)}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* File URL input (toggle) */}
      {showFile && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={fileInput}
              onChange={(e) => setFileInput(e.target.value)}
              placeholder="Paste file URL(s), comma-separated…"
              className="input-premium flex-1 text-xs py-2"
            />
            <button onClick={() => { setShowFile(false); setFileInput('') }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowFile((v) => !v)}
            className={cn(
              'p-2 rounded-lg transition-colors shrink-0 mb-0.5',
              showFile
                ? 'bg-brand-500/10 text-brand-400'
                : 'text-muted-foreground hover:text-brand-400 hover:bg-brand-500/10',
            )}
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={textRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            className="input-premium flex-1 resize-none leading-relaxed text-sm min-h-[40px] py-2"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 rounded-xl bg-gradient-brand text-white hover:opacity-90 transition-all disabled:opacity-40 shrink-0 mb-0.5"
          >
            {sending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
