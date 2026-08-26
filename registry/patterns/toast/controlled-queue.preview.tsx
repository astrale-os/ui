import { useState } from 'react'

import { ToastControlledQueue, type QueueToast } from './controlled-queue.js'

export default function ToastControlledQueuePreview() {
  const [queue, setQueue] = useState<readonly QueueToast[]>([
    { id: 'ready', title: 'Revision ready', description: 'Every check passed.' },
  ])
  return (
    <ToastControlledQueue
      queue={queue}
      onDismiss={(id) => setQueue((current) => current.filter((notice) => notice.id !== id))}
      onAction={() => undefined}
    />
  )
}
