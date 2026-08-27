import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/card/**/*.preview.tsx")

export const previewLoaders = {
  "component/card/card-01#default": modules["../../../../../registry/variants/source/components/card/card-01/card-01.preview.tsx"]!,
  "component/card/card-02#default": modules["../../../../../registry/variants/source/components/card/card-02/card-02.preview.tsx"]!,
  "component/card/card-03#default": modules["../../../../../registry/variants/source/components/card/card-03/card-03.preview.tsx"]!,
  "component/card/card-04#default": modules["../../../../../registry/variants/source/components/card/card-04/card-04.preview.tsx"]!,
  "component/card/card-05#default": modules["../../../../../registry/variants/source/components/card/card-05/card-05.preview.tsx"]!,
  "component/card/card-06#default": modules["../../../../../registry/variants/source/components/card/card-06/card-06.preview.tsx"]!,
  "component/card/card-07#default": modules["../../../../../registry/variants/source/components/card/card-07/card-07.preview.tsx"]!,
  "component/card/card-08#default": modules["../../../../../registry/variants/source/components/card/card-08/card-08.preview.tsx"]!,
  "component/card/card-09#default": modules["../../../../../registry/variants/source/components/card/card-09/card-09.preview.tsx"]!,
  "component/card/card-10#default": modules["../../../../../registry/variants/source/components/card/card-10/card-10.preview.tsx"]!,
  "component/card/card-11#default": modules["../../../../../registry/variants/source/components/card/card-11/card-11.preview.tsx"]!,
  "component/card/card-12#default": modules["../../../../../registry/variants/source/components/card/card-12/card-12.preview.tsx"]!,
  "component/card/card-13#default": modules["../../../../../registry/variants/source/components/card/card-13/card-13.preview.tsx"]!,
  "component/card/card-14#default": modules["../../../../../registry/variants/source/components/card/card-14/card-14.preview.tsx"]!,
  "component/card/card-15#default": modules["../../../../../registry/variants/source/components/card/card-15/card-15.preview.tsx"]!,
  "component/card/card-16#default": modules["../../../../../registry/variants/source/components/card/card-16/card-16.preview.tsx"]!,
  "component/card/card-17#default": modules["../../../../../registry/variants/source/components/card/card-17/card-17.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
