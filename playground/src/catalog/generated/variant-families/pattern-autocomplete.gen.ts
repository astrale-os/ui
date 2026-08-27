import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/autocomplete/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/autocomplete/autocomplete-01#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-01/autocomplete-01.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-02#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-02/autocomplete-02.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-03#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-03/autocomplete-03.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-04#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-04/autocomplete-04.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-05#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-05/autocomplete-05.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-06#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-06/autocomplete-06.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-07#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-07/autocomplete-07.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-08#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-08/autocomplete-08.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-09#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-09/autocomplete-09.preview.tsx"]!,
  "pattern/autocomplete/autocomplete-10#default": modules["../../../../../registry/variants/source/patterns/autocomplete/autocomplete-10/autocomplete-10.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
