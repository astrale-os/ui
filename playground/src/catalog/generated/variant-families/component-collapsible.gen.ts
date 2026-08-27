import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/collapsible/**/*.preview.tsx")

export const previewLoaders = {
  "component/collapsible/collapsible-01#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-01/collapsible-01.preview.tsx"]!,
  "component/collapsible/collapsible-02#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-02/collapsible-02.preview.tsx"]!,
  "component/collapsible/collapsible-03#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-03/collapsible-03.preview.tsx"]!,
  "component/collapsible/collapsible-04#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-04/collapsible-04.preview.tsx"]!,
  "component/collapsible/collapsible-05#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-05/collapsible-05.preview.tsx"]!,
  "component/collapsible/collapsible-06#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-06/collapsible-06.preview.tsx"]!,
  "component/collapsible/collapsible-07#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-07/collapsible-07.preview.tsx"]!,
  "component/collapsible/collapsible-08#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-08/collapsible-08.preview.tsx"]!,
  "component/collapsible/collapsible-09#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-09/collapsible-09.preview.tsx"]!,
  "component/collapsible/collapsible-10#default": modules["../../../../../registry/variants/source/components/collapsible/collapsible-10/collapsible-10.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
