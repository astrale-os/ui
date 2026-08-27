import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/input-mask/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/input-mask/input-mask-01#default":
      return modules["../../../../../registry/variants/source/components/input-mask/input-mask-01/input-mask-01.preview.tsx"]!()
    case "component/input-mask/input-mask-02#default":
      return modules["../../../../../registry/variants/source/components/input-mask/input-mask-02/input-mask-02.preview.tsx"]!()
    case "component/input-mask/input-mask-03#default":
      return modules["../../../../../registry/variants/source/components/input-mask/input-mask-03/input-mask-03.preview.tsx"]!()
    case "component/input-mask/input-mask-04#default":
      return modules["../../../../../registry/variants/source/components/input-mask/input-mask-04/input-mask-04.preview.tsx"]!()
    case "component/input-mask/input-mask-05#default":
      return modules["../../../../../registry/variants/source/components/input-mask/input-mask-05/input-mask-05.preview.tsx"]!()
    case "component/input-mask/input-mask-06#default":
      return modules["../../../../../registry/variants/source/components/input-mask/input-mask-06/input-mask-06.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
