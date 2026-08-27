import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/rating/**/*.preview.tsx")

export const previewLoaders = {
  "component/rating/rating-01#default": modules["../../../../../registry/variants/source/components/rating/rating-01/rating-01.preview.tsx"]!,
  "component/rating/rating-02#default": modules["../../../../../registry/variants/source/components/rating/rating-02/rating-02.preview.tsx"]!,
  "component/rating/rating-03#default": modules["../../../../../registry/variants/source/components/rating/rating-03/rating-03.preview.tsx"]!,
  "component/rating/rating-04#default": modules["../../../../../registry/variants/source/components/rating/rating-04/rating-04.preview.tsx"]!,
  "component/rating/rating-05#default": modules["../../../../../registry/variants/source/components/rating/rating-05/rating-05.preview.tsx"]!,
  "component/rating/rating-06#default": modules["../../../../../registry/variants/source/components/rating/rating-06/rating-06.preview.tsx"]!,
  "component/rating/rating-07#default": modules["../../../../../registry/variants/source/components/rating/rating-07/rating-07.preview.tsx"]!,
  "component/rating/rating-08#default": modules["../../../../../registry/variants/source/components/rating/rating-08/rating-08.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
