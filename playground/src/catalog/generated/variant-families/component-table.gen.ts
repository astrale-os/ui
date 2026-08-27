import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/table/**/*.preview.tsx")

export const previewLoaders = {
  "component/table/table-01#default": modules["../../../../../registry/variants/source/components/table/table-01/table-01.preview.tsx"]!,
  "component/table/table-02#default": modules["../../../../../registry/variants/source/components/table/table-02/table-02.preview.tsx"]!,
  "component/table/table-03#default": modules["../../../../../registry/variants/source/components/table/table-03/table-03.preview.tsx"]!,
  "component/table/table-04#default": modules["../../../../../registry/variants/source/components/table/table-04/table-04.preview.tsx"]!,
  "component/table/table-05#default": modules["../../../../../registry/variants/source/components/table/table-05/table-05.preview.tsx"]!,
  "component/table/table-06#default": modules["../../../../../registry/variants/source/components/table/table-06/table-06.preview.tsx"]!,
  "component/table/table-07#default": modules["../../../../../registry/variants/source/components/table/table-07/table-07.preview.tsx"]!,
  "component/table/table-08#default": modules["../../../../../registry/variants/source/components/table/table-08/table-08.preview.tsx"]!,
  "component/table/table-09#default": modules["../../../../../registry/variants/source/components/table/table-09/table-09.preview.tsx"]!,
  "component/table/table-10#default": modules["../../../../../registry/variants/source/components/table/table-10/table-10.preview.tsx"]!,
  "component/table/table-11#default": modules["../../../../../registry/variants/source/components/table/table-11/table-11.preview.tsx"]!,
  "component/table/table-12#default": modules["../../../../../registry/variants/source/components/table/table-12/table-12.preview.tsx"]!,
  "component/table/table-13#default": modules["../../../../../registry/variants/source/components/table/table-13/table-13.preview.tsx"]!,
  "component/table/table-14#default": modules["../../../../../registry/variants/source/components/table/table-14/table-14.preview.tsx"]!,
  "component/table/table-15#default": modules["../../../../../registry/variants/source/components/table/table-15/table-15.preview.tsx"]!,
  "component/table/table-16#default": modules["../../../../../registry/variants/source/components/table/table-16/table-16.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
