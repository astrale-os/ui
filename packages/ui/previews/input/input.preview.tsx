import { Input } from '@astrale-os/ui/input'

export const preview = { source: '@shadcn/input' } as const

export default function InputPreview() {
  return <Input aria-label="Domain path" defaultValue="/:observatory.astrale.ai" />
}
