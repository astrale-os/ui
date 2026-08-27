import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/command/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/command/command-01#default": modules["../../../../../registry/variants/source/patterns/command/command-01/command-01.preview.tsx"]!,
  "pattern/command/command-02#default": modules["../../../../../registry/variants/source/patterns/command/command-02/command-02.preview.tsx"]!,
  "pattern/command/command-03#default": modules["../../../../../registry/variants/source/patterns/command/command-03/command-03.preview.tsx"]!,
  "pattern/command/command-04#default": modules["../../../../../registry/variants/source/patterns/command/command-04/command-04.preview.tsx"]!,
  "pattern/command/command-05#default": modules["../../../../../registry/variants/source/patterns/command/command-05/command-05.preview.tsx"]!,
  "pattern/command/command-06#default": modules["../../../../../registry/variants/source/patterns/command/command-06/command-06.preview.tsx"]!,
  "pattern/command/command-07#default": modules["../../../../../registry/variants/source/patterns/command/command-07/command-07.preview.tsx"]!,
  "pattern/command/command-08#default": modules["../../../../../registry/variants/source/patterns/command/command-08/command-08.preview.tsx"]!,
  "pattern/command/command-09#default": modules["../../../../../registry/variants/source/patterns/command/command-09/command-09.preview.tsx"]!,
  "pattern/command/command-10#default": modules["../../../../../registry/variants/source/patterns/command/command-10/command-10.preview.tsx"]!,
  "pattern/command/command-11#default": modules["../../../../../registry/variants/source/patterns/command/command-11/command-11.preview.tsx"]!,
  "pattern/command/command-12#default": modules["../../../../../registry/variants/source/patterns/command/command-12/command-12.preview.tsx"]!,
  "pattern/command/command-13#default": modules["../../../../../registry/variants/source/patterns/command/command-13/command-13.preview.tsx"]!,
  "pattern/command/command-14#default": modules["../../../../../registry/variants/source/patterns/command/command-14/command-14.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
