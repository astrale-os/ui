import { Marker, MarkerContent } from './marker.js'

export const preview = { canvas: 'compact', source: '@shadcn/marker' } as const

export default function MarkerPreview() {
  return (
    <Marker variant="separator">
      <MarkerContent>Today</MarkerContent>
    </Marker>
  )
}
