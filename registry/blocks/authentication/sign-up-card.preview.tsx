import { useState } from 'react'

import { SignUpCard } from './sign-up-card.js'

export default function SignUpCardPreview() {
  const [values, setValues] = useState<Record<string, string>>({
    name: 'Alicia Koch',
    email: 'alicia@astrale.ai',
    password: 'qualified',
  })
  return (
    <SignUpCard
      values={values}
      onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      onSubmit={() => undefined}
    />
  )
}
