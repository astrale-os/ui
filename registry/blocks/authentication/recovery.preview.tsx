import { useState } from 'react'

import { RecoveryCard } from './recovery.js'

export default function RecoveryCardPreview() {
  const [values, setValues] = useState<Record<string, string>>({ email: 'operator@astrale.ai' })
  return (
    <RecoveryCard
      values={values}
      onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      onSubmit={() => undefined}
    />
  )
}
