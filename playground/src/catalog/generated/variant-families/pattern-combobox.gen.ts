import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/combobox/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/combobox/combobox-01#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-01/combobox-01.preview.tsx"]!,
  "pattern/combobox/combobox-02#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-02/combobox-02.preview.tsx"]!,
  "pattern/combobox/combobox-03#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-03/combobox-03.preview.tsx"]!,
  "pattern/combobox/combobox-04#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-04/combobox-04.preview.tsx"]!,
  "pattern/combobox/combobox-05#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-05/combobox-05.preview.tsx"]!,
  "pattern/combobox/combobox-06#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-06/combobox-06.preview.tsx"]!,
  "pattern/combobox/combobox-07#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-07/combobox-07.preview.tsx"]!,
  "pattern/combobox/combobox-08#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-08/combobox-08.preview.tsx"]!,
  "pattern/combobox/combobox-09#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-09/combobox-09.preview.tsx"]!,
  "pattern/combobox/combobox-10#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-10/combobox-10.preview.tsx"]!,
  "pattern/combobox/combobox-11#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-11/combobox-11.preview.tsx"]!,
  "pattern/combobox/combobox-12#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-12/combobox-12.preview.tsx"]!,
  "pattern/combobox/combobox-13#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-13/combobox-13.preview.tsx"]!,
  "pattern/combobox/combobox-14#default": modules["../../../../../registry/variants/source/patterns/combobox/combobox-14/combobox-14.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
