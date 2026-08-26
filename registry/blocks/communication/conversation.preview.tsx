import { messages } from './communication.fixture.js'
import { ConversationBlock } from './conversation.js'

export default function ConversationBlockPreview() {
  return <ConversationBlock title="Qualification" messages={messages} onRetry={() => undefined} />
}
