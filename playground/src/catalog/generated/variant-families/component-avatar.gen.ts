import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/avatar/**/*.preview.tsx")

export const previewLoaders = {
  "component/avatar/avatar-01#default": modules["../../../../../registry/variants/source/components/avatar/avatar-01/avatar-01.preview.tsx"]!,
  "component/avatar/avatar-02#default": modules["../../../../../registry/variants/source/components/avatar/avatar-02/avatar-02.preview.tsx"]!,
  "component/avatar/avatar-03#default": modules["../../../../../registry/variants/source/components/avatar/avatar-03/avatar-03.preview.tsx"]!,
  "component/avatar/avatar-04#default": modules["../../../../../registry/variants/source/components/avatar/avatar-04/avatar-04.preview.tsx"]!,
  "component/avatar/avatar-05#default": modules["../../../../../registry/variants/source/components/avatar/avatar-05/avatar-05.preview.tsx"]!,
  "component/avatar/avatar-06#default": modules["../../../../../registry/variants/source/components/avatar/avatar-06/avatar-06.preview.tsx"]!,
  "component/avatar/avatar-07#default": modules["../../../../../registry/variants/source/components/avatar/avatar-07/avatar-07.preview.tsx"]!,
  "component/avatar/avatar-08#default": modules["../../../../../registry/variants/source/components/avatar/avatar-08/avatar-08.preview.tsx"]!,
  "component/avatar/avatar-09#default": modules["../../../../../registry/variants/source/components/avatar/avatar-09/avatar-09.preview.tsx"]!,
  "component/avatar/avatar-10#default": modules["../../../../../registry/variants/source/components/avatar/avatar-10/avatar-10.preview.tsx"]!,
  "component/avatar/avatar-11#default": modules["../../../../../registry/variants/source/components/avatar/avatar-11/avatar-11.preview.tsx"]!,
  "component/avatar/avatar-12#default": modules["../../../../../registry/variants/source/components/avatar/avatar-12/avatar-12.preview.tsx"]!,
  "component/avatar/avatar-13#default": modules["../../../../../registry/variants/source/components/avatar/avatar-13/avatar-13.preview.tsx"]!,
  "component/avatar/avatar-14#default": modules["../../../../../registry/variants/source/components/avatar/avatar-14/avatar-14.preview.tsx"]!,
  "component/avatar/avatar-15#default": modules["../../../../../registry/variants/source/components/avatar/avatar-15/avatar-15.preview.tsx"]!,
  "component/avatar/avatar-16#default": modules["../../../../../registry/variants/source/components/avatar/avatar-16/avatar-16.preview.tsx"]!,
  "component/avatar/avatar-17#default": modules["../../../../../registry/variants/source/components/avatar/avatar-17/avatar-17.preview.tsx"]!,
  "component/avatar/avatar-18#default": modules["../../../../../registry/variants/source/components/avatar/avatar-18/avatar-18.preview.tsx"]!,
  "component/avatar/avatar-19#default": modules["../../../../../registry/variants/source/components/avatar/avatar-19/avatar-19.preview.tsx"]!,
  "component/avatar/avatar-20#default": modules["../../../../../registry/variants/source/components/avatar/avatar-20/avatar-20.preview.tsx"]!,
  "component/avatar/avatar-21#default": modules["../../../../../registry/variants/source/components/avatar/avatar-21/avatar-21.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
