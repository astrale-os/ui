import { useState } from 'react'

import { ApplicationSidebar } from './application.js'

export const preview = { canvas: 'wide' } as const

export default function ApplicationSidebarPreview() {
  const [current, setCurrent] = useState('catalog')
  const [collapsed, setCollapsed] = useState(false)
  return (
    <ApplicationSidebar
      routes={[
        { id: 'catalog', label: 'Catalog' },
        { id: 'themes', label: 'Themes' },
      ]}
      current={current}
      collapsed={collapsed}
      onNavigate={setCurrent}
      onCollapsedChange={setCollapsed}
    />
  )
}
