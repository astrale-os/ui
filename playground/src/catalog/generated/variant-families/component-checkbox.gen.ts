import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/checkbox/**/*.preview.tsx")

export const previewLoaders = {
  "component/checkbox/checkbox-01#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-01/checkbox-01.preview.tsx"]!,
  "component/checkbox/checkbox-02#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-02/checkbox-02.preview.tsx"]!,
  "component/checkbox/checkbox-03#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-03/checkbox-03.preview.tsx"]!,
  "component/checkbox/checkbox-04#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-04/checkbox-04.preview.tsx"]!,
  "component/checkbox/checkbox-05#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-05/checkbox-05.preview.tsx"]!,
  "component/checkbox/checkbox-06#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-06/checkbox-06.preview.tsx"]!,
  "component/checkbox/checkbox-07#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-07/checkbox-07.preview.tsx"]!,
  "component/checkbox/checkbox-08#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-08/checkbox-08.preview.tsx"]!,
  "component/checkbox/checkbox-09#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-09/checkbox-09.preview.tsx"]!,
  "component/checkbox/checkbox-10#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-10/checkbox-10.preview.tsx"]!,
  "component/checkbox/checkbox-11#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-11/checkbox-11.preview.tsx"]!,
  "component/checkbox/checkbox-12#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-12/checkbox-12.preview.tsx"]!,
  "component/checkbox/checkbox-13#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-13/checkbox-13.preview.tsx"]!,
  "component/checkbox/checkbox-14#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-14/checkbox-14.preview.tsx"]!,
  "component/checkbox/checkbox-15#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-15/checkbox-15.preview.tsx"]!,
  "component/checkbox/checkbox-16#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-16/checkbox-16.preview.tsx"]!,
  "component/checkbox/checkbox-17#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-17/checkbox-17.preview.tsx"]!,
  "component/checkbox/checkbox-18#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-18/checkbox-18.preview.tsx"]!,
  "component/checkbox/checkbox-19#default": modules["../../../../../registry/variants/source/components/checkbox/checkbox-19/checkbox-19.preview.tsx"]!,
} satisfies Record<string, () => Promise<PreviewModule>>
