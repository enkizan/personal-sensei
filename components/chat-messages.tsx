'use client'
import type { UIMessage, TextUIPart } from 'ai'
import { useApp } from '@/app/context'
import { DOMAINS } from '@/lib/domains'

interface Props { messages: UIMessage[]; isLoading: boolean }

export function ChatMessages({ messages, isLoading }: Props) {
  const { domain } = useApp()
  const tutorIcon = DOMAINS[domain]?.tutorIcon ?? '?'

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-12">
          <div className="text-4xl mb-3">{DOMAINS[domain].icon}</div>
          <p>Ask {DOMAINS[domain].tutor} anything about your studies.</p>
        </div>
      )}
      {messages.map(m => (
        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {m.role === 'assistant' && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {tutorIcon}
            </div>
          )}
          <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap ${
            m.role === 'user'
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          }`}>
            {m.parts.filter((p): p is TextUIPart => p.type === 'text').map(p => p.text).join('')}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {tutorIcon}
          </div>
          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 text-muted-foreground text-sm">
            Thinking…
          </div>
        </div>
      )}
    </div>
  )
}
