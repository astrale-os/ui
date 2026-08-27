import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/alert/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/alert/alert-01#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-01/alert-01.preview.tsx"]!()
    case "component/alert/alert-02#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-02/alert-02.preview.tsx"]!()
    case "component/alert/alert-03#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-03/alert-03.preview.tsx"]!()
    case "component/alert/alert-04#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-04/alert-04.preview.tsx"]!()
    case "component/alert/alert-05#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-05/alert-05.preview.tsx"]!()
    case "component/alert/alert-06#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-06/alert-06.preview.tsx"]!()
    case "component/alert/alert-07#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-07/alert-07.preview.tsx"]!()
    case "component/alert/alert-08#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-08/alert-08.preview.tsx"]!()
    case "component/alert/alert-09#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-09/alert-09.preview.tsx"]!()
    case "component/alert/alert-10#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-10/alert-10.preview.tsx"]!()
    case "component/alert/alert-11#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-11/alert-11.preview.tsx"]!()
    case "component/alert/alert-12#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-12/alert-12.preview.tsx"]!()
    case "component/alert/alert-13#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-13/alert-13.preview.tsx"]!()
    case "component/alert/alert-14#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-14/alert-14.preview.tsx"]!()
    case "component/alert/alert-15#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-15/alert-15.preview.tsx"]!()
    case "component/alert/alert-16#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-16/alert-16.preview.tsx"]!()
    case "component/alert/alert-17#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-17/alert-17.preview.tsx"]!()
    case "component/alert/alert-18#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-18/alert-18.preview.tsx"]!()
    case "component/alert/alert-19#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-19/alert-19.preview.tsx"]!()
    case "component/alert/alert-20#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-20/alert-20.preview.tsx"]!()
    case "component/alert/alert-21#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-21/alert-21.preview.tsx"]!()
    case "component/alert/alert-22#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-22/alert-22.preview.tsx"]!()
    case "component/alert/alert-23#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-23/alert-23.preview.tsx"]!()
    case "component/alert/alert-24#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-24/alert-24.preview.tsx"]!()
    case "component/alert/alert-25#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-25/alert-25.preview.tsx"]!()
    case "component/alert/alert-26#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-26/alert-26.preview.tsx"]!()
    case "component/alert/alert-27#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-27/alert-27.preview.tsx"]!()
    case "component/alert/alert-28#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-28/alert-28.preview.tsx"]!()
    case "component/alert/alert-29#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-29/alert-29.preview.tsx"]!()
    case "component/alert/alert-30#default":
      return modules["../../../../../registry/variants/source/components/alert/alert-30/alert-30.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
