import { useState } from 'react'

import { VerificationCard } from './verification.js'

export default function VerificationCardPreview() {
  const [values, setValues] = useState<Record<string, string>>({ code: '805214' })
  return (
    <VerificationCard
      values={values}
      onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      onSubmit={() => undefined}
    />
  )
}
