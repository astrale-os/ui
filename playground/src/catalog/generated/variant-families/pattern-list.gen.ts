import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/list/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/list/list-01#default": modules["../../../../../registry/variants/source/patterns/list/list-01/list-01.preview.tsx"]!,
  "pattern/list/list-02#default": modules["../../../../../registry/variants/source/patterns/list/list-02/list-02.preview.tsx"]!,
  "pattern/list/list-03#default": modules["../../../../../registry/variants/source/patterns/list/list-03/list-03.preview.tsx"]!,
  "pattern/list/list-04#default": modules["../../../../../registry/variants/source/patterns/list/list-04/list-04.preview.tsx"]!,
  "pattern/list/list-05#default": modules["../../../../../registry/variants/source/patterns/list/list-05/list-05.preview.tsx"]!,
  "pattern/list/list-06#default": modules["../../../../../registry/variants/source/patterns/list/list-06/list-06.preview.tsx"]!,
  "pattern/list/list-07#default": modules["../../../../../registry/variants/source/patterns/list/list-07/list-07.preview.tsx"]!,
  "pattern/list/list-08#default": modules["../../../../../registry/variants/source/patterns/list/list-08/list-08.preview.tsx"]!,
  "pattern/list/list-09#default": modules["../../../../../registry/variants/source/patterns/list/list-09/list-09.preview.tsx"]!,
  "pattern/list/list-10#default": modules["../../../../../registry/variants/source/patterns/list/list-10/list-10.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
