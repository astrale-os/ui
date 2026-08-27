import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/menubar/**/*.preview.tsx")

export const previewLoaders = {
  "component/menubar/menubar-01#default": modules["../../../../../registry/variants/source/components/menubar/menubar-01/menubar-01.preview.tsx"]!,
  "component/menubar/menubar-02#default": modules["../../../../../registry/variants/source/components/menubar/menubar-02/menubar-02.preview.tsx"]!,
  "component/menubar/menubar-03#default": modules["../../../../../registry/variants/source/components/menubar/menubar-03/menubar-03.preview.tsx"]!,
  "component/menubar/menubar-04#default": modules["../../../../../registry/variants/source/components/menubar/menubar-04/menubar-04.preview.tsx"]!,
  "component/menubar/menubar-05#default": modules["../../../../../registry/variants/source/components/menubar/menubar-05/menubar-05.preview.tsx"]!,
  "component/menubar/menubar-06#default": modules["../../../../../registry/variants/source/components/menubar/menubar-06/menubar-06.preview.tsx"]!,
  "component/menubar/menubar-07#default": modules["../../../../../registry/variants/source/components/menubar/menubar-07/menubar-07.preview.tsx"]!,
  "component/menubar/menubar-08#default": modules["../../../../../registry/variants/source/components/menubar/menubar-08/menubar-08.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
