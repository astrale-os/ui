import { EmptyToFirstValue } from './empty-first-value.js'

export default function EmptyToFirstValuePreview() {
  return (
    <EmptyToFirstValue
      title="No Domains yet"
      description="Create the first Domain to begin."
      onCreate={() => undefined}
    />
  )
}
