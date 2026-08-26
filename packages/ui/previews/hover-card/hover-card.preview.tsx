import { Button } from '@astrale-os/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@astrale-os/ui/hover-card'

export const preview = { source: '@shadcn/hover-card' } as const

export default function HoverCardPreview() {
  return (
    <HoverCard>
      <HoverCardTrigger render={<Button variant="link" />}>kernel.Identity</HoverCardTrigger>
      <HoverCardContent>
        <strong>Identity</strong>
        <p className="muted-copy">Exact authority-bearing Class.</p>
      </HoverCardContent>
    </HoverCard>
  )
}
