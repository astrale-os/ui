import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/scroll-area/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/scroll-area/scroll-area-01#default":
      return modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-01/scroll-area-01.preview.tsx"]!()
    case "component/scroll-area/scroll-area-02#default":
      return modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-02/scroll-area-02.preview.tsx"]!()
    case "component/scroll-area/scroll-area-03#default":
      return modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-03/scroll-area-03.preview.tsx"]!()
    case "component/scroll-area/scroll-area-04#default":
      return modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-04/scroll-area-04.preview.tsx"]!()
    case "component/scroll-area/scroll-area-05#default":
      return modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-05/scroll-area-05.preview.tsx"]!()
    case "component/scroll-area/scroll-area-06#default":
      return modules["../../../../../registry/variants/source/components/scroll-area/scroll-area-06/scroll-area-06.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
