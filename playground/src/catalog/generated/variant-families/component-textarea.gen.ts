import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/textarea/**/*.preview.tsx")

export const previewLoaders = {
  "component/textarea/textarea-01#default": modules["../../../../../registry/variants/source/components/textarea/textarea-01/textarea-01.preview.tsx"]!,
  "component/textarea/textarea-02#default": modules["../../../../../registry/variants/source/components/textarea/textarea-02/textarea-02.preview.tsx"]!,
  "component/textarea/textarea-03#default": modules["../../../../../registry/variants/source/components/textarea/textarea-03/textarea-03.preview.tsx"]!,
  "component/textarea/textarea-04#default": modules["../../../../../registry/variants/source/components/textarea/textarea-04/textarea-04.preview.tsx"]!,
  "component/textarea/textarea-05#default": modules["../../../../../registry/variants/source/components/textarea/textarea-05/textarea-05.preview.tsx"]!,
  "component/textarea/textarea-06#default": modules["../../../../../registry/variants/source/components/textarea/textarea-06/textarea-06.preview.tsx"]!,
  "component/textarea/textarea-07#default": modules["../../../../../registry/variants/source/components/textarea/textarea-07/textarea-07.preview.tsx"]!,
  "component/textarea/textarea-08#default": modules["../../../../../registry/variants/source/components/textarea/textarea-08/textarea-08.preview.tsx"]!,
  "component/textarea/textarea-09#default": modules["../../../../../registry/variants/source/components/textarea/textarea-09/textarea-09.preview.tsx"]!,
  "component/textarea/textarea-10#default": modules["../../../../../registry/variants/source/components/textarea/textarea-10/textarea-10.preview.tsx"]!,
  "component/textarea/textarea-11#default": modules["../../../../../registry/variants/source/components/textarea/textarea-11/textarea-11.preview.tsx"]!,
  "component/textarea/textarea-12#default": modules["../../../../../registry/variants/source/components/textarea/textarea-12/textarea-12.preview.tsx"]!,
  "component/textarea/textarea-13#default": modules["../../../../../registry/variants/source/components/textarea/textarea-13/textarea-13.preview.tsx"]!,
  "component/textarea/textarea-14#default": modules["../../../../../registry/variants/source/components/textarea/textarea-14/textarea-14.preview.tsx"]!,
  "component/textarea/textarea-15#default": modules["../../../../../registry/variants/source/components/textarea/textarea-15/textarea-15.preview.tsx"]!,
  "component/textarea/textarea-16#default": modules["../../../../../registry/variants/source/components/textarea/textarea-16/textarea-16.preview.tsx"]!,
  "component/textarea/textarea-17#default": modules["../../../../../registry/variants/source/components/textarea/textarea-17/textarea-17.preview.tsx"]!,
  "component/textarea/textarea-18#default": modules["../../../../../registry/variants/source/components/textarea/textarea-18/textarea-18.preview.tsx"]!,
  "component/textarea/textarea-19#default": modules["../../../../../registry/variants/source/components/textarea/textarea-19/textarea-19.preview.tsx"]!,
  "component/textarea/textarea-20#default": modules["../../../../../registry/variants/source/components/textarea/textarea-20/textarea-20.preview.tsx"]!,
  "component/textarea/textarea-21#default": modules["../../../../../registry/variants/source/components/textarea/textarea-21/textarea-21.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
