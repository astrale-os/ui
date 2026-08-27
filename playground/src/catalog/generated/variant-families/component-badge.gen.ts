import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/badge/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/badge/badge-01#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-01/badge-01.preview.tsx"]!()
    case "component/badge/badge-02#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-02/badge-02.preview.tsx"]!()
    case "component/badge/badge-03#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-03/badge-03.preview.tsx"]!()
    case "component/badge/badge-04#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-04/badge-04.preview.tsx"]!()
    case "component/badge/badge-05#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-05/badge-05.preview.tsx"]!()
    case "component/badge/badge-06#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-06/badge-06.preview.tsx"]!()
    case "component/badge/badge-07#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-07/badge-07.preview.tsx"]!()
    case "component/badge/badge-08#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-08/badge-08.preview.tsx"]!()
    case "component/badge/badge-09#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-09/badge-09.preview.tsx"]!()
    case "component/badge/badge-10#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-10/badge-10.preview.tsx"]!()
    case "component/badge/badge-11#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-11/badge-11.preview.tsx"]!()
    case "component/badge/badge-12#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-12/badge-12.preview.tsx"]!()
    case "component/badge/badge-13#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-13/badge-13.preview.tsx"]!()
    case "component/badge/badge-14#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-14/badge-14.preview.tsx"]!()
    case "component/badge/badge-15#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-15/badge-15.preview.tsx"]!()
    case "component/badge/badge-16#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-16/badge-16.preview.tsx"]!()
    case "component/badge/badge-17#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-17/badge-17.preview.tsx"]!()
    case "component/badge/badge-18#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-18/badge-18.preview.tsx"]!()
    case "component/badge/badge-19#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-19/badge-19.preview.tsx"]!()
    case "component/badge/badge-20#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-20/badge-20.preview.tsx"]!()
    case "component/badge/badge-21#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-21/badge-21.preview.tsx"]!()
    case "component/badge/badge-22#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-22/badge-22.preview.tsx"]!()
    case "component/badge/badge-23#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-23/badge-23.preview.tsx"]!()
    case "component/badge/badge-24#default":
      return modules["../../../../../registry/variants/source/components/badge/badge-24/badge-24.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
