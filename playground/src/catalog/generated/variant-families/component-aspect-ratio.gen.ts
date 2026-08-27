import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/aspect-ratio/**/*.preview.tsx")

export const previewLoaders = {
  "component/aspect-ratio/aspect-ratio-01#default": modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-01/aspect-ratio-01.preview.tsx"]!,
  "component/aspect-ratio/aspect-ratio-02#default": modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-02/aspect-ratio-02.preview.tsx"]!,
  "component/aspect-ratio/aspect-ratio-03#default": modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-03/aspect-ratio-03.preview.tsx"]!,
  "component/aspect-ratio/aspect-ratio-04#default": modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-04/aspect-ratio-04.preview.tsx"]!,
  "component/aspect-ratio/aspect-ratio-05#default": modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-05/aspect-ratio-05.preview.tsx"]!,
  "component/aspect-ratio/aspect-ratio-06#default": modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-06/aspect-ratio-06.preview.tsx"]!,
  "component/aspect-ratio/aspect-ratio-07#default": modules["../../../../../registry/variants/source/components/aspect-ratio/aspect-ratio-07/aspect-ratio-07.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
