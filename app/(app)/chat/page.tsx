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
}: {
  initialMessages: UIMessage[]
  conversationId: number
  domain: string
  studentName: string
}) {
  const [input, setInput] = useState('')
  const domainRef      = useRef(domain)
  const studentNameRef = useRef(studentName)
  useEffect(() => { domainRef.current = domain },           [domain])
  useEffect(() => { studentNameRef.current = studentName }, [studentName])

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      body: () => ({
        domain:        domainRef.current,
        studentName:   studentNameRef.current,
        lessonContext: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    // Save user message immediately before sending
    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, role: 'user', content: input }),
    })
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex-1 rounded-xl border bg-card overflow-hidden flex flex-col">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question…"
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
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
  // chatKey forces ChatInner to remount (and useChat to reinitialize) on new conversation
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
        <h1 className="text-xl font-bold">Ask Sensei</h1>
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
        />
      )}
    </div>
  )
}
