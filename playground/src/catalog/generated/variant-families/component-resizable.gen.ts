import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/resizable/**/*.preview.tsx")

export const previewLoaders = {
  "component/resizable/resizable-01#default": modules["../../../../../registry/variants/source/components/resizable/resizable-01/resizable-01.preview.tsx"]!,
  "component/resizable/resizable-02#default": modules["../../../../../registry/variants/source/components/resizable/resizable-02/resizable-02.preview.tsx"]!,
  "component/resizable/resizable-03#default": modules["../../../../../registry/variants/source/components/resizable/resizable-03/resizable-03.preview.tsx"]!,
  "component/resizable/resizable-04#default": modules["../../../../../registry/variants/source/components/resizable/resizable-04/resizable-04.preview.tsx"]!,
  "component/resizable/resizable-05#default": modules["../../../../../registry/variants/source/components/resizable/resizable-05/resizable-05.preview.tsx"]!,
  "component/resizable/resizable-06#default": modules["../../../../../registry/variants/source/components/resizable/resizable-06/resizable-06.preview.tsx"]!,
  "component/resizable/resizable-07#default": modules["../../../../../registry/variants/source/components/resizable/resizable-07/resizable-07.preview.tsx"]!,
  "component/resizable/resizable-08#default": modules["../../../../../registry/variants/source/components/resizable/resizable-08/resizable-08.preview.tsx"]!,
  "component/resizable/resizable-09#default": modules["../../../../../registry/variants/source/components/resizable/resizable-09/resizable-09.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
