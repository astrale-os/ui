import { AspectRatio } from '@astrale-os/ui/aspect-ratio'

export const preview = { canvas: 'wide', source: '@shadcn/aspect-ratio' } as const

export default function AspectRatioPreview() {
  return (
    <AspectRatio ratio={16 / 9} className="aspect-specimen">
      <span>16:9 preview surface</span>
    </AspectRatio>
  )
}
