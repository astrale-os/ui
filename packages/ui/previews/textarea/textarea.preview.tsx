import { Textarea } from '@astrale-os/ui/textarea'

export const preview = { source: '@shadcn/textarea' } as const

export default function TextareaPreview() {
  return <Textarea aria-label="Release note" defaultValue="Revision qualified and ready." />
}
