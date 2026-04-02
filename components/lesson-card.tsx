import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LessonCardProps {
  id: number; level: string; topic: string; chapter: number
  status?: 'in_progress' | 'completed' | null
}

export function LessonCard({ id, level, topic, chapter, status }: LessonCardProps) {
  return (
    <Link href={`/lessons/${id}`}>
      <Card className="hover:bg-muted/50 cursor-pointer transition-colors border-l-4 border-primary">
        <CardContent className="py-5 flex items-center justify-between">
          <div>
            <p className="font-medium font-heading">{topic}</p>
            <p className="text-xs text-muted-foreground">Chapter {chapter}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase text-xs">{level}</Badge>
            {status === 'completed'   && <Badge className="text-xs">✓</Badge>}
            {status === 'in_progress' && <Badge variant="secondary" className="text-xs">In progress</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
