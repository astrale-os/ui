import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/date-and-time-picker/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/date-and-time-picker/date-picker-01#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-01/date-picker-01.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-02#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-02/date-picker-02.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-03#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-03/date-picker-03.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-04#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-04/date-picker-04.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-05#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-05/date-picker-05.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-06#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-06/date-picker-06.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-07#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-07/date-picker-07.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-08#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-08/date-picker-08.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-09#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-09/date-picker-09.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-10#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-10/date-picker-10.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-11#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-11/date-picker-11.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-12#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-12/date-picker-12.preview.tsx"]!,
  "pattern/date-and-time-picker/date-picker-13#default": modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-13/date-picker-13.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
