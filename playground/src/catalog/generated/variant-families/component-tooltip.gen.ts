import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/tooltip/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/tooltip/tooltip-01#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-01/tooltip-01.preview.tsx"]!()
    case "component/tooltip/tooltip-02#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-02/tooltip-02.preview.tsx"]!()
    case "component/tooltip/tooltip-03#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-03/tooltip-03.preview.tsx"]!()
    case "component/tooltip/tooltip-04#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-04/tooltip-04.preview.tsx"]!()
    case "component/tooltip/tooltip-05#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-05/tooltip-05.preview.tsx"]!()
    case "component/tooltip/tooltip-06#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-06/tooltip-06.preview.tsx"]!()
    case "component/tooltip/tooltip-07#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-07/tooltip-07.preview.tsx"]!()
    case "component/tooltip/tooltip-08#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-08/tooltip-08.preview.tsx"]!()
    case "component/tooltip/tooltip-09#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-09/tooltip-09.preview.tsx"]!()
    case "component/tooltip/tooltip-10#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-10/tooltip-10.preview.tsx"]!()
    case "component/tooltip/tooltip-11#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-11/tooltip-11.preview.tsx"]!()
    case "component/tooltip/tooltip-12#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-12/tooltip-12.preview.tsx"]!()
    case "component/tooltip/tooltip-13#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-13/tooltip-13.preview.tsx"]!()
    case "component/tooltip/tooltip-14#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-14/tooltip-14.preview.tsx"]!()
    case "component/tooltip/tooltip-15#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-15/tooltip-15.preview.tsx"]!()
    case "component/tooltip/tooltip-16#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-16/tooltip-16.preview.tsx"]!()
    case "component/tooltip/tooltip-17#default":
      return modules["../../../../../registry/variants/source/components/tooltip/tooltip-17/tooltip-17.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
