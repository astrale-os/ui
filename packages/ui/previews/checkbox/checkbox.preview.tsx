import { Checkbox } from '@astrale-os/ui/checkbox'
import { Field, FieldLabel } from '@astrale-os/ui/field'

export const preview = { source: '@shadcn/checkbox' } as const

export default function CheckboxPreview() {
  return (
    <Field orientation="horizontal">
      <Checkbox id="inherit-capabilities" defaultChecked />
      <FieldLabel htmlFor="inherit-capabilities">Include inherited capabilities</FieldLabel>
    </Field>
  )
}
