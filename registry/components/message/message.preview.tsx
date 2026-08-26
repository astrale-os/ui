import { Bubble, BubbleContent } from '../bubble/bubble.js'
import { Message, MessageContent, MessageFooter, MessageHeader } from './message.js'

export const preview = { source: '@shadcn/message' } as const

export default function MessagePreview() {
  return (
    <Message>
      <MessageContent>
        <MessageHeader>Astrale UI</MessageHeader>
        <Bubble variant="muted">
          <BubbleContent>Exact upstream component anatomy.</BubbleContent>
        </Bubble>
        <MessageFooter>Just now</MessageFooter>
      </MessageContent>
    </Message>
  )
}
