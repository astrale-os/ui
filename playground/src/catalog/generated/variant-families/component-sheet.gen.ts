import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/sheet/**/*.preview.tsx")

export const previewLoaders = {
  "component/sheet/sheet-01#default": modules["../../../../../registry/variants/source/components/sheet/sheet-01/sheet-01.preview.tsx"]!,
  "component/sheet/sheet-02#default": modules["../../../../../registry/variants/source/components/sheet/sheet-02/sheet-02.preview.tsx"]!,
  "component/sheet/sheet-03#default": modules["../../../../../registry/variants/source/components/sheet/sheet-03/sheet-03.preview.tsx"]!,
  "component/sheet/sheet-04#default": modules["../../../../../registry/variants/source/components/sheet/sheet-04/sheet-04.preview.tsx"]!,
  "component/sheet/sheet-05#default": modules["../../../../../registry/variants/source/components/sheet/sheet-05/sheet-05.preview.tsx"]!,
  "component/sheet/sheet-06#default": modules["../../../../../registry/variants/source/components/sheet/sheet-06/sheet-06.preview.tsx"]!,
  "component/sheet/sheet-07#default": modules["../../../../../registry/variants/source/components/sheet/sheet-07/sheet-07.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
