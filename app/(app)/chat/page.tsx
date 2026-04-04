'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { TextStreamChatTransport } from 'ai'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { useApp } from '@/app/context'
import { ChatMessages } from '@/components/chat-messages'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Plus } from 'lucide-react'

interface Command { id: number; command_name: string; description: string; prompt: string }

function dbMessagesToUIMessages(
  dbMsgs: { id: number; role: string; content: string; created_at: string | null }[]
): UIMessage[] {
  return dbMsgs.map(m => ({
    id:    String(m.id),
    role:  m.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: m.content }],
  }))
}

function ChatInner({
  initialMessages,
  conversationId,
  domain,
  studentName,
  studentId,
}: {
  initialMessages: UIMessage[]
  conversationId: number
  domain: string
  studentName: string
  studentId: number
}) {
  const [input, setInput] = useState('')
  const [commands,    setCommands]    = useState<Command[]>([])
  const [dropdown,    setDropdown]    = useState<Command[]>([])
  const [dropdownIdx, setDropdownIdx] = useState(0)
  const pendingCommandRef = useRef<string>('')
  const domainRef         = useRef(domain)
  const studentNameRef    = useRef(studentName)

  useEffect(() => { domainRef.current = domain },           [domain])
  useEffect(() => { studentNameRef.current = studentName }, [studentName])

  // Load student's commands once on mount
  useEffect(() => {
    if (!studentId) return
    fetch(`/api/commands?student_id=${studentId}`)
      .then(r => r.json())
      .then(setCommands)
      .catch(() => {/* non-fatal */})
  }, [studentId])

  // Update autocomplete dropdown as user types
  useEffect(() => {
    if (!input.startsWith('/')) { setDropdown([]); return }
    const typed = input.slice(1).split(' ')[0].toLowerCase()
    setDropdown(commands.filter(c => c.command_name.startsWith(typed)))
    setDropdownIdx(0)
  }, [input, commands])

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      body: () => ({
        domain:        domainRef.current,
        studentName:   studentNameRef.current,
        lessonContext: '',
        commandPrompt: pendingCommandRef.current,
      }),
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Save assistant message when streaming completes
  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready' && messages.length > 0) {
      const last = messages[messages.length - 1]
      if (last.role === 'assistant') {
        const text = last.parts
          .filter(p => p.type === 'text')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => p.text)
          .join('')
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId, role: 'assistant', content: text }),
        })
      }
    }
    prevStatusRef.current = status
  }, [status, messages, conversationId])

  function selectCommand(cmd: Command) {
    setInput(`/${cmd.command_name} `)
    setDropdown([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Reset pending command, then check for a matching command prefix
    pendingCommandRef.current = ''

    if (input.startsWith('/')) {
      const parts = input.slice(1).split(' ')
      const cmdName = parts[0].toLowerCase()
      const match = commands.find(c => c.command_name === cmdName)
      if (match) pendingCommandRef.current = match.prompt
    }

    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, role: 'user', content: input }),
    })
    sendMessage({ text: input })
    setInput('')
    setDropdown([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (dropdown.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setDropdownIdx(i => Math.min(i + 1, dropdown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDropdownIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Tab') {
      e.preventDefault()
      selectCommand(dropdown[dropdownIdx])
    } else if (e.key === 'Escape') {
      setDropdown([])
    }
  }

  return (
    <div className="flex-1 rounded-xl border bg-card overflow-hidden flex flex-col">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <div className="relative">
        {dropdown.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-4 rounded-lg border bg-popover shadow-md overflow-hidden z-10">
            {dropdown.map((cmd, i) => (
              <button
                key={cmd.id}
                type="button"
                onMouseDown={ev => { ev.preventDefault(); selectCommand(cmd) }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                  i === dropdownIdx ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <span className="font-mono text-primary font-semibold">/{cmd.command_name}</span>
                <span className="text-muted-foreground truncate">{cmd.description}</span>
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… or type / for commands"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { currentStudent, domain } = useApp()
  const searchParams = useSearchParams()
  const lessonId = parseInt(searchParams.get('lesson_id') ?? '-1')

  const [ready, setReady]                     = useState(false)
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [conversationId, setConversationId]   = useState<number | null>(null)
  const [chatKey, setChatKey] = useState(0)

  const loadOrCreateConversation = useCallback(async () => {
    if (!currentStudent) return
    setReady(false)

    const params = new URLSearchParams({
      student_id: String(currentStudent.id),
      domain,
      ...(lessonId !== -1 && { lesson_id: String(lessonId) }),
    })
    const res  = await fetch(`/api/chat/history?${params}`)
    const data = await res.json()

    if (data.conversation) {
      setConversationId(data.conversation.id)
      setInitialMessages(dbMessagesToUIMessages(data.messages))
    } else {
      const createRes  = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: currentStudent.id, domain, lesson_id: lessonId }),
      })
      const createData = await createRes.json()
      setConversationId(createData.conversation.id)
      setInitialMessages([])
    }

    setReady(true)
  }, [currentStudent, domain, lessonId])

  useEffect(() => { loadOrCreateConversation() }, [loadOrCreateConversation])

  const handleNewConversation = async () => {
    if (!currentStudent) return
    const res  = await fetch('/api/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: currentStudent.id, domain, lesson_id: lessonId }),
    })
    const data = await res.json()
    setConversationId(data.conversation.id)
    setInitialMessages([])
    setChatKey(k => k + 1)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-3xl font-heading font-semibold leading-tight">Ask Sensei</h1>
        <Button variant="outline" size="sm" onClick={handleNewConversation}>
          <Plus className="h-4 w-4 mr-1" />
          New conversation
        </Button>
      </div>
      {!ready || conversationId === null ? (
        <div className="flex-1 rounded-xl border bg-card flex items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : (
        <ChatInner
          key={chatKey}
          initialMessages={initialMessages}
          conversationId={conversationId}
          domain={domain}
          studentName={currentStudent?.name ?? 'Student'}
          studentId={currentStudent?.id ?? 0}
        />
      )}
    </div>
  )
}
