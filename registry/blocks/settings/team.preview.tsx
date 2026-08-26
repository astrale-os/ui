import { useState } from 'react'

import { TeamSettings } from './team.js'

export default function TeamSettingsPreview() {
  const [values, setValues] = useState<Record<string, string | boolean>>({
    teamName: 'Astrale',
    discoverable: true,
  })
  return (
    <TeamSettings
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      onToggle={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      onSave={() => undefined}
    />
  )
}
