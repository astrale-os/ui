import { useState } from 'react'

import { AppearanceSettings } from './appearance.js'

export default function AppearanceSettingsPreview() {
  const [values, setValues] = useState<Record<string, string | boolean>>({
    compact: false,
    motion: true,
  })
  return (
    <AppearanceSettings
      values={values}
      onToggle={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      onSave={() => undefined}
    />
  )
}
