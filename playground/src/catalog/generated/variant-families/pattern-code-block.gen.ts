import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/code-block/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/code-block/code-block-01#default": modules["../../../../../registry/variants/source/patterns/code-block/code-block-01/code-block-01.preview.tsx"]!,
  "pattern/code-block/code-block-02#default": modules["../../../../../registry/variants/source/patterns/code-block/code-block-02/code-block-02.preview.tsx"]!,
  "pattern/code-block/code-block-03#default": modules["../../../../../registry/variants/source/patterns/code-block/code-block-03/code-block-03.preview.tsx"]!,
  "pattern/code-block/code-block-04#default": modules["../../../../../registry/variants/source/patterns/code-block/code-block-04/code-block-04.preview.tsx"]!,
  "pattern/code-block/code-block-05#default": modules["../../../../../registry/variants/source/patterns/code-block/code-block-05/code-block-05.preview.tsx"]!,
  "pattern/code-block/code-block-06#default": modules["../../../../../registry/variants/source/patterns/code-block/code-block-06/code-block-06.preview.tsx"]!,
  "pattern/code-block/code-block-07#default": modules["../../../../../registry/variants/source/patterns/code-block/code-block-07/code-block-07.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
