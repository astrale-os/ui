import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/typography/**/*.preview.tsx")

export const previewLoaders = {
  "component/typography/typography-01#default": modules["../../../../../registry/variants/source/components/typography/typography-01/typography-01.preview.tsx"]!,
  "component/typography/typography-02#default": modules["../../../../../registry/variants/source/components/typography/typography-02/typography-02.preview.tsx"]!,
  "component/typography/typography-03#default": modules["../../../../../registry/variants/source/components/typography/typography-03/typography-03.preview.tsx"]!,
  "component/typography/typography-04#default": modules["../../../../../registry/variants/source/components/typography/typography-04/typography-04.preview.tsx"]!,
  "component/typography/typography-05#default": modules["../../../../../registry/variants/source/components/typography/typography-05/typography-05.preview.tsx"]!,
  "component/typography/typography-06#default": modules["../../../../../registry/variants/source/components/typography/typography-06/typography-06.preview.tsx"]!,
  "component/typography/typography-07#default": modules["../../../../../registry/variants/source/components/typography/typography-07/typography-07.preview.tsx"]!,
  "component/typography/typography-08#default": modules["../../../../../registry/variants/source/components/typography/typography-08/typography-08.preview.tsx"]!,
  "component/typography/typography-09#default": modules["../../../../../registry/variants/source/components/typography/typography-09/typography-09.preview.tsx"]!,
  "component/typography/typography-10#default": modules["../../../../../registry/variants/source/components/typography/typography-10/typography-10.preview.tsx"]!,
  "component/typography/typography-11#default": modules["../../../../../registry/variants/source/components/typography/typography-11/typography-11.preview.tsx"]!,
  "component/typography/typography-12#default": modules["../../../../../registry/variants/source/components/typography/typography-12/typography-12.preview.tsx"]!,
  "component/typography/typography-13#default": modules["../../../../../registry/variants/source/components/typography/typography-13/typography-13.preview.tsx"]!,
  "component/typography/typography-14#default": modules["../../../../../registry/variants/source/components/typography/typography-14/typography-14.preview.tsx"]!,
  "component/typography/typography-15#default": modules["../../../../../registry/variants/source/components/typography/typography-15/typography-15.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
