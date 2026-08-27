import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/avatar/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/avatar/avatar-01#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-01/avatar-01.preview.tsx"]!()
    case "component/avatar/avatar-02#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-02/avatar-02.preview.tsx"]!()
    case "component/avatar/avatar-03#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-03/avatar-03.preview.tsx"]!()
    case "component/avatar/avatar-04#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-04/avatar-04.preview.tsx"]!()
    case "component/avatar/avatar-05#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-05/avatar-05.preview.tsx"]!()
    case "component/avatar/avatar-06#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-06/avatar-06.preview.tsx"]!()
    case "component/avatar/avatar-07#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-07/avatar-07.preview.tsx"]!()
    case "component/avatar/avatar-08#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-08/avatar-08.preview.tsx"]!()
    case "component/avatar/avatar-09#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-09/avatar-09.preview.tsx"]!()
    case "component/avatar/avatar-10#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-10/avatar-10.preview.tsx"]!()
    case "component/avatar/avatar-11#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-11/avatar-11.preview.tsx"]!()
    case "component/avatar/avatar-12#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-12/avatar-12.preview.tsx"]!()
    case "component/avatar/avatar-13#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-13/avatar-13.preview.tsx"]!()
    case "component/avatar/avatar-14#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-14/avatar-14.preview.tsx"]!()
    case "component/avatar/avatar-15#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-15/avatar-15.preview.tsx"]!()
    case "component/avatar/avatar-16#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-16/avatar-16.preview.tsx"]!()
    case "component/avatar/avatar-17#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-17/avatar-17.preview.tsx"]!()
    case "component/avatar/avatar-18#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-18/avatar-18.preview.tsx"]!()
    case "component/avatar/avatar-19#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-19/avatar-19.preview.tsx"]!()
    case "component/avatar/avatar-20#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-20/avatar-20.preview.tsx"]!()
    case "component/avatar/avatar-21#default":
      return modules["../../../../../registry/variants/source/components/avatar/avatar-21/avatar-21.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
