import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/toggle/**/*.preview.tsx")

export const previewLoaders = {
  "component/toggle/toggle-01#default": modules["../../../../../registry/variants/source/components/toggle/toggle-01/toggle-01.preview.tsx"]!,
  "component/toggle/toggle-02#default": modules["../../../../../registry/variants/source/components/toggle/toggle-02/toggle-02.preview.tsx"]!,
  "component/toggle/toggle-03#default": modules["../../../../../registry/variants/source/components/toggle/toggle-03/toggle-03.preview.tsx"]!,
  "component/toggle/toggle-04#default": modules["../../../../../registry/variants/source/components/toggle/toggle-04/toggle-04.preview.tsx"]!,
  "component/toggle/toggle-05#default": modules["../../../../../registry/variants/source/components/toggle/toggle-05/toggle-05.preview.tsx"]!,
  "component/toggle/toggle-06#default": modules["../../../../../registry/variants/source/components/toggle/toggle-06/toggle-06.preview.tsx"]!,
  "component/toggle/toggle-07#default": modules["../../../../../registry/variants/source/components/toggle/toggle-07/toggle-07.preview.tsx"]!,
  "component/toggle/toggle-08#default": modules["../../../../../registry/variants/source/components/toggle/toggle-08/toggle-08.preview.tsx"]!,
  "component/toggle/toggle-09#default": modules["../../../../../registry/variants/source/components/toggle/toggle-09/toggle-09.preview.tsx"]!,
  "component/toggle/toggle-10#default": modules["../../../../../registry/variants/source/components/toggle/toggle-10/toggle-10.preview.tsx"]!,
  "component/toggle/toggle-11#default": modules["../../../../../registry/variants/source/components/toggle/toggle-11/toggle-11.preview.tsx"]!,
  "component/toggle/toggle-12#default": modules["../../../../../registry/variants/source/components/toggle/toggle-12/toggle-12.preview.tsx"]!,
  "component/toggle/toggle-13#default": modules["../../../../../registry/variants/source/components/toggle/toggle-13/toggle-13.preview.tsx"]!,
  "component/toggle/toggle-14#default": modules["../../../../../registry/variants/source/components/toggle/toggle-14/toggle-14.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
