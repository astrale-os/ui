import { NativeSelect, NativeSelectOption } from '@astrale-os/ui/native-select'

export const preview = { source: '@shadcn/native-select' } as const

export default function NativeSelectPreview() {
  return (
    <NativeSelect aria-label="Output format" defaultValue="json">
      <NativeSelectOption value="json">JSON</NativeSelectOption>
      <NativeSelectOption value="yaml">YAML</NativeSelectOption>
    </NativeSelect>
  )
}
