import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/label/**/*.preview.tsx")

export const previewLoaders = {
  "component/label/label-01#default": modules["../../../../../registry/variants/source/components/label/label-01/label-01.preview.tsx"]!,
  "component/label/label-02#default": modules["../../../../../registry/variants/source/components/label/label-02/label-02.preview.tsx"]!,
  "component/label/label-03#default": modules["../../../../../registry/variants/source/components/label/label-03/label-03.preview.tsx"]!,
  "component/label/label-04#default": modules["../../../../../registry/variants/source/components/label/label-04/label-04.preview.tsx"]!,
  "component/label/label-05#default": modules["../../../../../registry/variants/source/components/label/label-05/label-05.preview.tsx"]!,
  "component/label/label-06#default": modules["../../../../../registry/variants/source/components/label/label-06/label-06.preview.tsx"]!,
  "component/label/label-07#default": modules["../../../../../registry/variants/source/components/label/label-07/label-07.preview.tsx"]!,
  "component/label/label-08#default": modules["../../../../../registry/variants/source/components/label/label-08/label-08.preview.tsx"]!,
  "component/label/label-09#default": modules["../../../../../registry/variants/source/components/label/label-09/label-09.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
