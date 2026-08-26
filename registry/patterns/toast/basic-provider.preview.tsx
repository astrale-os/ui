import { useState } from 'react'

import { ToastRegion, type ToastNotice } from './basic-provider.js'

export default function ToastRegionPreview() {
  const [notices, setNotices] = useState<readonly ToastNotice[]>([
    { id: 'ready', message: 'Revision ready.' },
  ])
  return (
    <ToastRegion
      style={{ position: 'static' }}
      notices={notices}
      onDismiss={(id) => setNotices((current) => current.filter((notice) => notice.id !== id))}
    />
  )
}
