import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/popover/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/popover/popover-01#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-01/popover-01.preview.tsx"]!()
    case "component/popover/popover-02#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-02/popover-02.preview.tsx"]!()
    case "component/popover/popover-03#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-03/popover-03.preview.tsx"]!()
    case "component/popover/popover-04#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-04/popover-04.preview.tsx"]!()
    case "component/popover/popover-05#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-05/popover-05.preview.tsx"]!()
    case "component/popover/popover-06#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-06/popover-06.preview.tsx"]!()
    case "component/popover/popover-07#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-07/popover-07.preview.tsx"]!()
    case "component/popover/popover-08#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-08/popover-08.preview.tsx"]!()
    case "component/popover/popover-09#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-09/popover-09.preview.tsx"]!()
    case "component/popover/popover-10#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-10/popover-10.preview.tsx"]!()
    case "component/popover/popover-11#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-11/popover-11.preview.tsx"]!()
    case "component/popover/popover-12#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-12/popover-12.preview.tsx"]!()
    case "component/popover/popover-13#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-13/popover-13.preview.tsx"]!()
    case "component/popover/popover-14#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-14/popover-14.preview.tsx"]!()
    case "component/popover/popover-15#default":
      return modules["../../../../../registry/variants/source/components/popover/popover-15/popover-15.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
