import { Field, FieldLabel } from '@astrale-os/ui/field'
import { RadioGroup, RadioGroupItem } from '@astrale-os/ui/radio-group'
import { useState } from 'react'

export const preview = { source: '@shadcn/radio-group' } as const

export default function RadioGroupPreview() {
  const [value, setValue] = useState('safe')
  return (
    <RadioGroup value={value} onValueChange={setValue} aria-label="Admission mode">
      <Field orientation="horizontal">
        <RadioGroupItem value="safe" id="radio-safe" />
        <FieldLabel htmlFor="radio-safe">Safe</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="direct" id="radio-direct" />
        <FieldLabel htmlFor="radio-direct">Direct</FieldLabel>
      </Field>
    </RadioGroup>
  )
}
