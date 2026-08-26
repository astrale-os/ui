import { Field, FieldDescription, FieldGroup, FieldLabel } from '@astrale-os/ui/field'
import { Input } from '@astrale-os/ui/input'

export const preview = { source: '@shadcn/field' } as const

export default function FieldPreview() {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="field-name">Domain label</FieldLabel>
        <Input id="field-name" defaultValue="Observatory" />
        <FieldDescription>Visible to every authorized operator.</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
