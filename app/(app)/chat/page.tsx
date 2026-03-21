'use client'
import { useState, useRef, useEffect } from 'react'
import { TextStreamChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { useApp } from '@/app/context'
import { ChatMessages } from '@/components/chat-messages'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

export default function ChatPage() {
  const { currentStudent, domain } = useApp()
  const [input, setInput] = useState('')

  // Use refs so the transport callback always reads the latest values
  const domainRef      = useRef(domain)
  const studentNameRef = useRef(currentStudent?.name ?? 'Student')
  useEffect(() => { domainRef.current = domain }, [domain])
  useEffect(() => { studentNameRef.current = currentStudent?.name ?? 'Student' }, [currentStudent])

  const { messages, sendMessage, status } = useChat({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <h1 className="text-xl font-bold mb-4 shrink-0">Ask Sensei</h1>
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
    </div>
  )
}
