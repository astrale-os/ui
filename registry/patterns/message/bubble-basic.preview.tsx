import { MessageBubble } from './bubble-basic.js'

export default function MessageBubblePreview() {
  return (
    <MessageBubble role="assistant" name="Runtime" timestamp="Just now">
      The schema revision is ready.
    </MessageBubble>
  )
}
