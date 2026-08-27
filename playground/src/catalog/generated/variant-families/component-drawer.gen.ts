import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/drawer/**/*.preview.tsx")

export const previewLoaders = {
  "component/drawer/drawer-01#default": modules["../../../../../registry/variants/source/components/drawer/drawer-01/drawer-01.preview.tsx"]!,
  "component/drawer/drawer-02#default": modules["../../../../../registry/variants/source/components/drawer/drawer-02/drawer-02.preview.tsx"]!,
  "component/drawer/drawer-03#default": modules["../../../../../registry/variants/source/components/drawer/drawer-03/drawer-03.preview.tsx"]!,
  "component/drawer/drawer-04#default": modules["../../../../../registry/variants/source/components/drawer/drawer-04/drawer-04.preview.tsx"]!,
  "component/drawer/drawer-05#default": modules["../../../../../registry/variants/source/components/drawer/drawer-05/drawer-05.preview.tsx"]!,
  "component/drawer/drawer-06#default": modules["../../../../../registry/variants/source/components/drawer/drawer-06/drawer-06.preview.tsx"]!,
  "component/drawer/drawer-07#default": modules["../../../../../registry/variants/source/components/drawer/drawer-07/drawer-07.preview.tsx"]!,
  "component/drawer/drawer-08#default": modules["../../../../../registry/variants/source/components/drawer/drawer-08/drawer-08.preview.tsx"]!,
  "component/drawer/drawer-09#default": modules["../../../../../registry/variants/source/components/drawer/drawer-09/drawer-09.preview.tsx"]!,
  "component/drawer/drawer-10#default": modules["../../../../../registry/variants/source/components/drawer/drawer-10/drawer-10.preview.tsx"]!,
  "component/drawer/drawer-11#default": modules["../../../../../registry/variants/source/components/drawer/drawer-11/drawer-11.preview.tsx"]!,
  "component/drawer/drawer-12#default": modules["../../../../../registry/variants/source/components/drawer/drawer-12/drawer-12.preview.tsx"]!,
  "component/drawer/drawer-13#default": modules["../../../../../registry/variants/source/components/drawer/drawer-13/drawer-13.preview.tsx"]!,
  "component/drawer/drawer-14#default": modules["../../../../../registry/variants/source/components/drawer/drawer-14/drawer-14.preview.tsx"]!,
  "component/drawer/drawer-15#default": modules["../../../../../registry/variants/source/components/drawer/drawer-15/drawer-15.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
