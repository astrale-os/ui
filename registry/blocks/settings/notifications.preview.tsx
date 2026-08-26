import { useState } from 'react'

import { NotificationSettings } from './notifications.js'

export default function NotificationSettingsPreview() {
  const [values, setValues] = useState<Record<string, string | boolean>>({
    email: true,
    product: false,
  })
  return (
    <NotificationSettings
      values={values}
      onToggle={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      onSave={() => undefined}
    />
  )
}
