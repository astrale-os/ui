import { useState } from 'react'

import { ProfileSettings } from './profile.js'

export default function ProfileSettingsPreview() {
  const [values, setValues] = useState<Record<string, string | boolean>>({
    name: 'Alicia Koch',
    bio: 'Astrale operator',
  })
  return (
    <ProfileSettings
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      onSave={() => undefined}
    />
  )
}
