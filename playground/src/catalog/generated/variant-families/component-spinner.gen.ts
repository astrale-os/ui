import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/spinner/**/*.preview.tsx")

export const previewLoaders = {
  "component/spinner/spinner-01#default": modules["../../../../../registry/variants/source/components/spinner/spinner-01/spinner-01.preview.tsx"]!,
  "component/spinner/spinner-02#default": modules["../../../../../registry/variants/source/components/spinner/spinner-02/spinner-02.preview.tsx"]!,
  "component/spinner/spinner-03#default": modules["../../../../../registry/variants/source/components/spinner/spinner-03/spinner-03.preview.tsx"]!,
  "component/spinner/spinner-04#default": modules["../../../../../registry/variants/source/components/spinner/spinner-04/spinner-04.preview.tsx"]!,
  "component/spinner/spinner-05#default": modules["../../../../../registry/variants/source/components/spinner/spinner-05/spinner-05.preview.tsx"]!,
  "component/spinner/spinner-06#default": modules["../../../../../registry/variants/source/components/spinner/spinner-06/spinner-06.preview.tsx"]!,
  "component/spinner/spinner-07#default": modules["../../../../../registry/variants/source/components/spinner/spinner-07/spinner-07.preview.tsx"]!,
  "component/spinner/spinner-08#default": modules["../../../../../registry/variants/source/components/spinner/spinner-08/spinner-08.preview.tsx"]!,
  "component/spinner/spinner-09#default": modules["../../../../../registry/variants/source/components/spinner/spinner-09/spinner-09.preview.tsx"]!,
  "component/spinner/spinner-10#default": modules["../../../../../registry/variants/source/components/spinner/spinner-10/spinner-10.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
