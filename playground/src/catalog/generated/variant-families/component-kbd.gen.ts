import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/kbd/**/*.preview.tsx")

export const previewLoaders = {
  "component/kbd/kbd-01#default": modules["../../../../../registry/variants/source/components/kbd/kbd-01/kbd-01.preview.tsx"]!,
  "component/kbd/kbd-02#default": modules["../../../../../registry/variants/source/components/kbd/kbd-02/kbd-02.preview.tsx"]!,
  "component/kbd/kbd-03#default": modules["../../../../../registry/variants/source/components/kbd/kbd-03/kbd-03.preview.tsx"]!,
  "component/kbd/kbd-04#default": modules["../../../../../registry/variants/source/components/kbd/kbd-04/kbd-04.preview.tsx"]!,
  "component/kbd/kbd-05#default": modules["../../../../../registry/variants/source/components/kbd/kbd-05/kbd-05.preview.tsx"]!,
  "component/kbd/kbd-06#default": modules["../../../../../registry/variants/source/components/kbd/kbd-06/kbd-06.preview.tsx"]!,
  "component/kbd/kbd-07#default": modules["../../../../../registry/variants/source/components/kbd/kbd-07/kbd-07.preview.tsx"]!,
  "component/kbd/kbd-08#default": modules["../../../../../registry/variants/source/components/kbd/kbd-08/kbd-08.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
