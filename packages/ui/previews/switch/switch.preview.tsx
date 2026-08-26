import { Field, FieldLabel } from '@astrale-os/ui/field'
import { Switch } from '@astrale-os/ui/switch'
import { useState } from 'react'

export const preview = { source: '@shadcn/switch' } as const

export default function SwitchPreview() {
  const [value, setValue] = useState(true)
  return (
    <Field orientation="horizontal">
      <FieldLabel htmlFor="stream-journal">Stream journal</FieldLabel>
      <Switch id="stream-journal" checked={value} onCheckedChange={setValue} />
    </Field>
  )
}
