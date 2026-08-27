import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/input-mask/**/*.preview.tsx")

export const previewLoaders = {
  "component/input-mask/input-mask-01#default": modules["../../../../../registry/variants/source/components/input-mask/input-mask-01/input-mask-01.preview.tsx"]!,
  "component/input-mask/input-mask-02#default": modules["../../../../../registry/variants/source/components/input-mask/input-mask-02/input-mask-02.preview.tsx"]!,
  "component/input-mask/input-mask-03#default": modules["../../../../../registry/variants/source/components/input-mask/input-mask-03/input-mask-03.preview.tsx"]!,
  "component/input-mask/input-mask-04#default": modules["../../../../../registry/variants/source/components/input-mask/input-mask-04/input-mask-04.preview.tsx"]!,
  "component/input-mask/input-mask-05#default": modules["../../../../../registry/variants/source/components/input-mask/input-mask-05/input-mask-05.preview.tsx"]!,
  "component/input-mask/input-mask-06#default": modules["../../../../../registry/variants/source/components/input-mask/input-mask-06/input-mask-06.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
