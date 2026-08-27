import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/separator/**/*.preview.tsx")

export const previewLoaders = {
  "component/separator/separator-01#default": modules["../../../../../registry/variants/source/components/separator/separator-01/separator-01.preview.tsx"]!,
  "component/separator/separator-02#default": modules["../../../../../registry/variants/source/components/separator/separator-02/separator-02.preview.tsx"]!,
  "component/separator/separator-03#default": modules["../../../../../registry/variants/source/components/separator/separator-03/separator-03.preview.tsx"]!,
  "component/separator/separator-04#default": modules["../../../../../registry/variants/source/components/separator/separator-04/separator-04.preview.tsx"]!,
  "component/separator/separator-05#default": modules["../../../../../registry/variants/source/components/separator/separator-05/separator-05.preview.tsx"]!,
  "component/separator/separator-06#default": modules["../../../../../registry/variants/source/components/separator/separator-06/separator-06.preview.tsx"]!,
  "component/separator/separator-07#default": modules["../../../../../registry/variants/source/components/separator/separator-07/separator-07.preview.tsx"]!,
  "component/separator/separator-08#default": modules["../../../../../registry/variants/source/components/separator/separator-08/separator-08.preview.tsx"]!,
  "component/separator/separator-09#default": modules["../../../../../registry/variants/source/components/separator/separator-09/separator-09.preview.tsx"]!,
  "component/separator/separator-10#default": modules["../../../../../registry/variants/source/components/separator/separator-10/separator-10.preview.tsx"]!,
  "component/separator/separator-11#default": modules["../../../../../registry/variants/source/components/separator/separator-11/separator-11.preview.tsx"]!,
  "component/separator/separator-12#default": modules["../../../../../registry/variants/source/components/separator/separator-12/separator-12.preview.tsx"]!,
  "component/separator/separator-13#default": modules["../../../../../registry/variants/source/components/separator/separator-13/separator-13.preview.tsx"]!,
  "component/separator/separator-14#default": modules["../../../../../registry/variants/source/components/separator/separator-14/separator-14.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
