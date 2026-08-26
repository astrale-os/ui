import { MessageThread } from './thread.js'

export default function MessageThreadPreview() {
  return (
    <MessageThread
      messages={[
        { id: '1', author: 'Runtime', content: 'The schema revision is ready.' },
        { id: '2', author: 'Operator', content: 'Proceed with qualification.' },
      ]}
      onRetry={() => undefined}
    />
  )
}
