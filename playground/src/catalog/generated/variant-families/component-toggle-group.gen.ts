import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/toggle-group/**/*.preview.tsx")

export const previewLoaders = {
  "component/toggle-group/toggle-group-01#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-01/toggle-group-01.preview.tsx"]!,
  "component/toggle-group/toggle-group-02#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-02/toggle-group-02.preview.tsx"]!,
  "component/toggle-group/toggle-group-03#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-03/toggle-group-03.preview.tsx"]!,
  "component/toggle-group/toggle-group-04#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-04/toggle-group-04.preview.tsx"]!,
  "component/toggle-group/toggle-group-05#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-05/toggle-group-05.preview.tsx"]!,
  "component/toggle-group/toggle-group-06#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-06/toggle-group-06.preview.tsx"]!,
  "component/toggle-group/toggle-group-07#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-07/toggle-group-07.preview.tsx"]!,
  "component/toggle-group/toggle-group-08#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-08/toggle-group-08.preview.tsx"]!,
  "component/toggle-group/toggle-group-09#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-09/toggle-group-09.preview.tsx"]!,
  "component/toggle-group/toggle-group-10#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-10/toggle-group-10.preview.tsx"]!,
  "component/toggle-group/toggle-group-11#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-11/toggle-group-11.preview.tsx"]!,
  "component/toggle-group/toggle-group-12#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-12/toggle-group-12.preview.tsx"]!,
  "component/toggle-group/toggle-group-13#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-13/toggle-group-13.preview.tsx"]!,
  "component/toggle-group/toggle-group-14#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-14/toggle-group-14.preview.tsx"]!,
  "component/toggle-group/toggle-group-15#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-15/toggle-group-15.preview.tsx"]!,
  "component/toggle-group/toggle-group-16#default": modules["../../../../../registry/variants/source/components/toggle-group/toggle-group-16/toggle-group-16.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
