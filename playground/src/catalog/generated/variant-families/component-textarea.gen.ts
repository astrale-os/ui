import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/textarea/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/textarea/textarea-01#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-01/textarea-01.preview.tsx"]!()
    case "component/textarea/textarea-02#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-02/textarea-02.preview.tsx"]!()
    case "component/textarea/textarea-03#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-03/textarea-03.preview.tsx"]!()
    case "component/textarea/textarea-04#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-04/textarea-04.preview.tsx"]!()
    case "component/textarea/textarea-05#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-05/textarea-05.preview.tsx"]!()
    case "component/textarea/textarea-06#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-06/textarea-06.preview.tsx"]!()
    case "component/textarea/textarea-07#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-07/textarea-07.preview.tsx"]!()
    case "component/textarea/textarea-08#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-08/textarea-08.preview.tsx"]!()
    case "component/textarea/textarea-09#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-09/textarea-09.preview.tsx"]!()
    case "component/textarea/textarea-10#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-10/textarea-10.preview.tsx"]!()
    case "component/textarea/textarea-11#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-11/textarea-11.preview.tsx"]!()
    case "component/textarea/textarea-12#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-12/textarea-12.preview.tsx"]!()
    case "component/textarea/textarea-13#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-13/textarea-13.preview.tsx"]!()
    case "component/textarea/textarea-14#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-14/textarea-14.preview.tsx"]!()
    case "component/textarea/textarea-15#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-15/textarea-15.preview.tsx"]!()
    case "component/textarea/textarea-16#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-16/textarea-16.preview.tsx"]!()
    case "component/textarea/textarea-17#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-17/textarea-17.preview.tsx"]!()
    case "component/textarea/textarea-18#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-18/textarea-18.preview.tsx"]!()
    case "component/textarea/textarea-19#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-19/textarea-19.preview.tsx"]!()
    case "component/textarea/textarea-20#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-20/textarea-20.preview.tsx"]!()
    case "component/textarea/textarea-21#default":
      return modules["../../../../../registry/variants/source/components/textarea/textarea-21/textarea-21.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
