import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/progress/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/progress/progress-01#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-01/progress-01.preview.tsx"]!()
    case "component/progress/progress-02#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-02/progress-02.preview.tsx"]!()
    case "component/progress/progress-03#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-03/progress-03.preview.tsx"]!()
    case "component/progress/progress-04#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-04/progress-04.preview.tsx"]!()
    case "component/progress/progress-05#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-05/progress-05.preview.tsx"]!()
    case "component/progress/progress-06#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-06/progress-06.preview.tsx"]!()
    case "component/progress/progress-07#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-07/progress-07.preview.tsx"]!()
    case "component/progress/progress-08#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-08/progress-08.preview.tsx"]!()
    case "component/progress/progress-09#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-09/progress-09.preview.tsx"]!()
    case "component/progress/progress-10#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-10/progress-10.preview.tsx"]!()
    case "component/progress/progress-11#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-11/progress-11.preview.tsx"]!()
    case "component/progress/progress-12#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-12/progress-12.preview.tsx"]!()
    case "component/progress/progress-13#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-13/progress-13.preview.tsx"]!()
    case "component/progress/progress-14#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-14/progress-14.preview.tsx"]!()
    case "component/progress/progress-15#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-15/progress-15.preview.tsx"]!()
    case "component/progress/progress-16#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-16/progress-16.preview.tsx"]!()
    case "component/progress/progress-17#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-17/progress-17.preview.tsx"]!()
    case "component/progress/progress-18#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-18/progress-18.preview.tsx"]!()
    case "component/progress/progress-19#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-19/progress-19.preview.tsx"]!()
    case "component/progress/progress-20#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-20/progress-20.preview.tsx"]!()
    case "component/progress/progress-21#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-21/progress-21.preview.tsx"]!()
    case "component/progress/progress-22#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-22/progress-22.preview.tsx"]!()
    case "component/progress/progress-23#default":
      return modules["../../../../../registry/variants/source/components/progress/progress-23/progress-23.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
