'use client'
import { useChat } from 'ai/react'
import { useApp } from '@/app/context'
import { ChatMessages } from '@/components/chat-messages'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

export default function ChatPage() {
  const { currentStudent, domain } = useApp()

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api:  '/api/chat',
    body: {
      domain,
      studentName:   currentStudent?.name ?? 'Student',
      lessonContext: '',
    },
  })

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <h1 className="text-xl font-bold mb-4 shrink-0">Ask Sensei</h1>
      <div className="flex-1 rounded-xl border bg-card overflow-hidden flex flex-col">
        <ChatMessages messages={messages} isLoading={isLoading} />
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
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
