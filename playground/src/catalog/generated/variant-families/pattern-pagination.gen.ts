import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/pagination/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/pagination/pagination-01#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-01/pagination-01.preview.tsx"]!,
  "pattern/pagination/pagination-02#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-02/pagination-02.preview.tsx"]!,
  "pattern/pagination/pagination-03#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-03/pagination-03.preview.tsx"]!,
  "pattern/pagination/pagination-04#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-04/pagination-04.preview.tsx"]!,
  "pattern/pagination/pagination-05#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-05/pagination-05.preview.tsx"]!,
  "pattern/pagination/pagination-06#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-06/pagination-06.preview.tsx"]!,
  "pattern/pagination/pagination-07#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-07/pagination-07.preview.tsx"]!,
  "pattern/pagination/pagination-08#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-08/pagination-08.preview.tsx"]!,
  "pattern/pagination/pagination-09#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-09/pagination-09.preview.tsx"]!,
  "pattern/pagination/pagination-10#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-10/pagination-10.preview.tsx"]!,
  "pattern/pagination/pagination-11#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-11/pagination-11.preview.tsx"]!,
  "pattern/pagination/pagination-12#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-12/pagination-12.preview.tsx"]!,
  "pattern/pagination/pagination-13#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-13/pagination-13.preview.tsx"]!,
  "pattern/pagination/pagination-14#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-14/pagination-14.preview.tsx"]!,
  "pattern/pagination/pagination-15#default": modules["../../../../../registry/variants/source/patterns/pagination/pagination-15/pagination-15.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
