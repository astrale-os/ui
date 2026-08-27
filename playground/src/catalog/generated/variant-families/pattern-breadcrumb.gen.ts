import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/breadcrumb/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/breadcrumb/breadcrumb-01#default": modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-01/breadcrumb-01.preview.tsx"]!,
  "pattern/breadcrumb/breadcrumb-02#default": modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-02/breadcrumb-02.preview.tsx"]!,
  "pattern/breadcrumb/breadcrumb-03#default": modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-03/breadcrumb-03.preview.tsx"]!,
  "pattern/breadcrumb/breadcrumb-04#default": modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-04/breadcrumb-04.preview.tsx"]!,
  "pattern/breadcrumb/breadcrumb-05#default": modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-05/breadcrumb-05.preview.tsx"]!,
  "pattern/breadcrumb/breadcrumb-06#default": modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-06/breadcrumb-06.preview.tsx"]!,
  "pattern/breadcrumb/breadcrumb-07#default": modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-07/breadcrumb-07.preview.tsx"]!,
  "pattern/breadcrumb/breadcrumb-08#default": modules["../../../../../registry/variants/source/patterns/breadcrumb/breadcrumb-08/breadcrumb-08.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
