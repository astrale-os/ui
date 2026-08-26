import { Badge } from '@astrale-os/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@astrale-os/ui/card'

export const preview = { source: '@shadcn/card' } as const

export default function CardPreview() {
  return (
    <Card size="sm" className="w-full">
      <CardHeader>
        <CardTitle>Domain revision</CardTitle>
        <CardDescription>sha256:62d081…</CardDescription>
        <CardAction>
          <Badge>Current</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>Ready for deployment.</CardContent>
      <CardFooter>Committed 12 seconds ago</CardFooter>
    </Card>
  )
}
