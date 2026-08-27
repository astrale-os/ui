import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/stepper/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/stepper/stepper-01#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-01/stepper-01.preview.tsx"]!,
  "pattern/stepper/stepper-02#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-02/stepper-02.preview.tsx"]!,
  "pattern/stepper/stepper-03#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-03/stepper-03.preview.tsx"]!,
  "pattern/stepper/stepper-04#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-04/stepper-04.preview.tsx"]!,
  "pattern/stepper/stepper-05#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-05/stepper-05.preview.tsx"]!,
  "pattern/stepper/stepper-06#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-06/stepper-06.preview.tsx"]!,
  "pattern/stepper/stepper-07#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-07/stepper-07.preview.tsx"]!,
  "pattern/stepper/stepper-08#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-08/stepper-08.preview.tsx"]!,
  "pattern/stepper/stepper-09#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-09/stepper-09.preview.tsx"]!,
  "pattern/stepper/stepper-10#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-10/stepper-10.preview.tsx"]!,
  "pattern/stepper/stepper-11#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-11/stepper-11.preview.tsx"]!,
  "pattern/stepper/stepper-12#default": modules["../../../../../registry/variants/source/patterns/stepper/stepper-12/stepper-12.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
