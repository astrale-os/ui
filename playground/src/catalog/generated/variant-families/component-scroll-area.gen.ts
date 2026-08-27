import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/scroll-area/**/*.preview.tsx")

export const previewLoaders = {
  "component/scroll-area/scroll-area-01#default": modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-01/scroll-area-01.preview.tsx"]!,
  "component/scroll-area/scroll-area-02#default": modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-02/scroll-area-02.preview.tsx"]!,
  "component/scroll-area/scroll-area-03#default": modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-03/scroll-area-03.preview.tsx"]!,
  "component/scroll-area/scroll-area-04#default": modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-04/scroll-area-04.preview.tsx"]!,
  "component/scroll-area/scroll-area-05#default": modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-05/scroll-area-05.preview.tsx"]!,
  "component/scroll-area/scroll-area-06#default": modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-06/scroll-area-06.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
