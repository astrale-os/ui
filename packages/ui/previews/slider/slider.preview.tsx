import { Field, FieldLabel } from '@astrale-os/ui/field'
import { Label } from '@astrale-os/ui/label'
import { Slider } from '@astrale-os/ui/slider'
import { useState } from 'react'

export const preview = { source: '@shadcn/slider' } as const

export default function SliderPreview() {
  const [value, setValue] = useState([62])
  return (
    <Field>
      <FieldLabel>Retention</FieldLabel>
      <Label>
        Retention
        <Slider value={value} onValueChange={(next) => setValue(next as number[])} />
      </Label>
    </Field>
  )
}
