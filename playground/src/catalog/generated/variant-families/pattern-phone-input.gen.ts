import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/phone-input/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/phone-input/phone-input-01#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-01/phone-input-01.preview.tsx"]!,
  "pattern/phone-input/phone-input-02#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-02/phone-input-02.preview.tsx"]!,
  "pattern/phone-input/phone-input-03#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-03/phone-input-03.preview.tsx"]!,
  "pattern/phone-input/phone-input-04#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-04/phone-input-04.preview.tsx"]!,
  "pattern/phone-input/phone-input-05#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-05/phone-input-05.preview.tsx"]!,
  "pattern/phone-input/phone-input-06#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-06/phone-input-06.preview.tsx"]!,
  "pattern/phone-input/phone-input-07#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-07/phone-input-07.preview.tsx"]!,
  "pattern/phone-input/phone-input-08#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-08/phone-input-08.preview.tsx"]!,
  "pattern/phone-input/phone-input-09#default": modules["../../../../../registry/variants/source/patterns/phone-input/phone-input-09/phone-input-09.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
