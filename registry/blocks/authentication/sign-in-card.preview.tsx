import { useState } from 'react'

import { SignInCard } from './sign-in-card.js'

export default function SignInCardPreview() {
  const [values, setValues] = useState<Record<string, string>>({
    email: 'operator@astrale.ai',
    password: 'qualified',
  })
  return (
    <SignInCard
      values={values}
      onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      onSubmit={() => undefined}
    />
  )
}
