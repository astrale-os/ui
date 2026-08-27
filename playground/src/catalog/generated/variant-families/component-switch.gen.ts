import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/switch/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/switch/switch-01#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-01/switch-01.preview.tsx"]!()
    case "component/switch/switch-02#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-02/switch-02.preview.tsx"]!()
    case "component/switch/switch-03#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-03/switch-03.preview.tsx"]!()
    case "component/switch/switch-04#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-04/switch-04.preview.tsx"]!()
    case "component/switch/switch-05#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-05/switch-05.preview.tsx"]!()
    case "component/switch/switch-06#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-06/switch-06.preview.tsx"]!()
    case "component/switch/switch-07#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-07/switch-07.preview.tsx"]!()
    case "component/switch/switch-08#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-08/switch-08.preview.tsx"]!()
    case "component/switch/switch-09#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-09/switch-09.preview.tsx"]!()
    case "component/switch/switch-10#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-10/switch-10.preview.tsx"]!()
    case "component/switch/switch-11#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-11/switch-11.preview.tsx"]!()
    case "component/switch/switch-12#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-12/switch-12.preview.tsx"]!()
    case "component/switch/switch-13#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-13/switch-13.preview.tsx"]!()
    case "component/switch/switch-14#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-14/switch-14.preview.tsx"]!()
    case "component/switch/switch-15#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-15/switch-15.preview.tsx"]!()
    case "component/switch/switch-16#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-16/switch-16.preview.tsx"]!()
    case "component/switch/switch-17#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-17/switch-17.preview.tsx"]!()
    case "component/switch/switch-18#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-18/switch-18.preview.tsx"]!()
    case "component/switch/switch-19#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-19/switch-19.preview.tsx"]!()
    case "component/switch/switch-20#default":
      return modules["../../../../../registry/variants/source/components/switch/switch-20/switch-20.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
