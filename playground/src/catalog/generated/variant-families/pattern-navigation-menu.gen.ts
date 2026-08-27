import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/navigation-menu/**/*.preview.tsx")

export const previewLoaders = {
  "pattern/navigation-menu/navigation-menu-01#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-01/navigation-menu-01.preview.tsx"]!,
  "pattern/navigation-menu/navigation-menu-02#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-02/navigation-menu-02.preview.tsx"]!,
  "pattern/navigation-menu/navigation-menu-03#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-03/navigation-menu-03.preview.tsx"]!,
  "pattern/navigation-menu/navigation-menu-04#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-04/navigation-menu-04.preview.tsx"]!,
  "pattern/navigation-menu/navigation-menu-05#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-05/navigation-menu-05.preview.tsx"]!,
  "pattern/navigation-menu/navigation-menu-06#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-06/navigation-menu-06.preview.tsx"]!,
  "pattern/navigation-menu/navigation-menu-07#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-07/navigation-menu-07.preview.tsx"]!,
  "pattern/navigation-menu/navigation-menu-08#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-08/navigation-menu-08.preview.tsx"]!,
  "pattern/navigation-menu/navigation-menu-09#default": modules["../../../../../registry/variants/source/patterns/navigation-menu/navigation-menu-09/navigation-menu-09.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
