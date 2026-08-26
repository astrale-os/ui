import { Bubble, BubbleContent } from '../bubble/bubble.js'
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from './message-scroller.js'

export const preview = { source: '@shadcn/message-scroller' } as const

export default function MessageScrollerPreview() {
  return (
    <MessageScrollerProvider>
      <MessageScroller className="scroll-specimen">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <MessageScrollerItem messageId="catalog-message" scrollAnchor>
              <Bubble variant="muted">
                <BubbleContent>Scrollable message surface</BubbleContent>
              </Bubble>
            </MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
