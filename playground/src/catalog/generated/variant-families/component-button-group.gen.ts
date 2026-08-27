import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/button-group/**/*.preview.tsx")

export const previewLoaders = {
  "component/button-group/button-group-01#default": modules["../../../../../registry/variants/source/components/button-group/button-group-01/button-group-01.preview.tsx"]!,
  "component/button-group/button-group-02#default": modules["../../../../../registry/variants/source/components/button-group/button-group-02/button-group-02.preview.tsx"]!,
  "component/button-group/button-group-03#default": modules["../../../../../registry/variants/source/components/button-group/button-group-03/button-group-03.preview.tsx"]!,
  "component/button-group/button-group-04#default": modules["../../../../../registry/variants/source/components/button-group/button-group-04/button-group-04.preview.tsx"]!,
  "component/button-group/button-group-05#default": modules["../../../../../registry/variants/source/components/button-group/button-group-05/button-group-05.preview.tsx"]!,
  "component/button-group/button-group-06#default": modules["../../../../../registry/variants/source/components/button-group/button-group-06/button-group-06.preview.tsx"]!,
  "component/button-group/button-group-07#default": modules["../../../../../registry/variants/source/components/button-group/button-group-07/button-group-07.preview.tsx"]!,
  "component/button-group/button-group-08#default": modules["../../../../../registry/variants/source/components/button-group/button-group-08/button-group-08.preview.tsx"]!,
  "component/button-group/button-group-09#default": modules["../../../../../registry/variants/source/components/button-group/button-group-09/button-group-09.preview.tsx"]!,
  "component/button-group/button-group-10#default": modules["../../../../../registry/variants/source/components/button-group/button-group-10/button-group-10.preview.tsx"]!,
  "component/button-group/button-group-11#default": modules["../../../../../registry/variants/source/components/button-group/button-group-11/button-group-11.preview.tsx"]!,
  "component/button-group/button-group-12#default": modules["../../../../../registry/variants/source/components/button-group/button-group-12/button-group-12.preview.tsx"]!,
  "component/button-group/button-group-13#default": modules["../../../../../registry/variants/source/components/button-group/button-group-13/button-group-13.preview.tsx"]!,
  "component/button-group/button-group-14#default": modules["../../../../../registry/variants/source/components/button-group/button-group-14/button-group-14.preview.tsx"]!,
  "component/button-group/button-group-15#default": modules["../../../../../registry/variants/source/components/button-group/button-group-15/button-group-15.preview.tsx"]!,
  "component/button-group/button-group-16#default": modules["../../../../../registry/variants/source/components/button-group/button-group-16/button-group-16.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
