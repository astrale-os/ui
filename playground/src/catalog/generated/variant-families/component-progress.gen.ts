import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/progress/**/*.preview.tsx")

export const previewLoaders = {
  "component/progress/progress-01#default": modules["../../../../../registry/variants/source/components/progress/progress-01/progress-01.preview.tsx"]!,
  "component/progress/progress-02#default": modules["../../../../../registry/variants/source/components/progress/progress-02/progress-02.preview.tsx"]!,
  "component/progress/progress-03#default": modules["../../../../../registry/variants/source/components/progress/progress-03/progress-03.preview.tsx"]!,
  "component/progress/progress-04#default": modules["../../../../../registry/variants/source/components/progress/progress-04/progress-04.preview.tsx"]!,
  "component/progress/progress-05#default": modules["../../../../../registry/variants/source/components/progress/progress-05/progress-05.preview.tsx"]!,
  "component/progress/progress-06#default": modules["../../../../../registry/variants/source/components/progress/progress-06/progress-06.preview.tsx"]!,
  "component/progress/progress-07#default": modules["../../../../../registry/variants/source/components/progress/progress-07/progress-07.preview.tsx"]!,
  "component/progress/progress-08#default": modules["../../../../../registry/variants/source/components/progress/progress-08/progress-08.preview.tsx"]!,
  "component/progress/progress-09#default": modules["../../../../../registry/variants/source/components/progress/progress-09/progress-09.preview.tsx"]!,
  "component/progress/progress-10#default": modules["../../../../../registry/variants/source/components/progress/progress-10/progress-10.preview.tsx"]!,
  "component/progress/progress-11#default": modules["../../../../../registry/variants/source/components/progress/progress-11/progress-11.preview.tsx"]!,
  "component/progress/progress-12#default": modules["../../../../../registry/variants/source/components/progress/progress-12/progress-12.preview.tsx"]!,
  "component/progress/progress-13#default": modules["../../../../../registry/variants/source/components/progress/progress-13/progress-13.preview.tsx"]!,
  "component/progress/progress-14#default": modules["../../../../../registry/variants/source/components/progress/progress-14/progress-14.preview.tsx"]!,
  "component/progress/progress-15#default": modules["../../../../../registry/variants/source/components/progress/progress-15/progress-15.preview.tsx"]!,
  "component/progress/progress-16#default": modules["../../../../../registry/variants/source/components/progress/progress-16/progress-16.preview.tsx"]!,
  "component/progress/progress-17#default": modules["../../../../../registry/variants/source/components/progress/progress-17/progress-17.preview.tsx"]!,
  "component/progress/progress-18#default": modules["../../../../../registry/variants/source/components/progress/progress-18/progress-18.preview.tsx"]!,
  "component/progress/progress-19#default": modules["../../../../../registry/variants/source/components/progress/progress-19/progress-19.preview.tsx"]!,
  "component/progress/progress-20#default": modules["../../../../../registry/variants/source/components/progress/progress-20/progress-20.preview.tsx"]!,
  "component/progress/progress-21#default": modules["../../../../../registry/variants/source/components/progress/progress-21/progress-21.preview.tsx"]!,
  "component/progress/progress-22#default": modules["../../../../../registry/variants/source/components/progress/progress-22/progress-22.preview.tsx"]!,
  "component/progress/progress-23#default": modules["../../../../../registry/variants/source/components/progress/progress-23/progress-23.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
