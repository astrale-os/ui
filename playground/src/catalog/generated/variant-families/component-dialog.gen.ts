import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/dialog/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/dialog/dialog-01#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-01/dialog-01.preview.tsx"]!()
    case "component/dialog/dialog-02#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-02/dialog-02.preview.tsx"]!()
    case "component/dialog/dialog-03#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-03/dialog-03.preview.tsx"]!()
    case "component/dialog/dialog-04#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-04/dialog-04.preview.tsx"]!()
    case "component/dialog/dialog-05#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-05/dialog-05.preview.tsx"]!()
    case "component/dialog/dialog-06#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-06/dialog-06.preview.tsx"]!()
    case "component/dialog/dialog-07#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-07/dialog-07.preview.tsx"]!()
    case "component/dialog/dialog-08#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-08/dialog-08.preview.tsx"]!()
    case "component/dialog/dialog-09#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-09/dialog-09.preview.tsx"]!()
    case "component/dialog/dialog-10#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-10/dialog-10.preview.tsx"]!()
    case "component/dialog/dialog-11#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-11/dialog-11.preview.tsx"]!()
    case "component/dialog/dialog-12#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-12/dialog-12.preview.tsx"]!()
    case "component/dialog/dialog-13#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-13/dialog-13.preview.tsx"]!()
    case "component/dialog/dialog-14#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-14/dialog-14.preview.tsx"]!()
    case "component/dialog/dialog-15#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-15/dialog-15.preview.tsx"]!()
    case "component/dialog/dialog-16#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-16/dialog-16.preview.tsx"]!()
    case "component/dialog/dialog-17#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-17/dialog-17.preview.tsx"]!()
    case "component/dialog/dialog-18#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-18/dialog-18.preview.tsx"]!()
    case "component/dialog/dialog-19#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-19/dialog-19.preview.tsx"]!()
    case "component/dialog/dialog-20#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-20/dialog-20.preview.tsx"]!()
    case "component/dialog/dialog-21#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-21/dialog-21.preview.tsx"]!()
    case "component/dialog/dialog-22#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-22/dialog-22.preview.tsx"]!()
    case "component/dialog/dialog-23#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-23/dialog-23.preview.tsx"]!()
    case "component/dialog/dialog-24#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-24/dialog-24.preview.tsx"]!()
    case "component/dialog/dialog-25#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-25/dialog-25.preview.tsx"]!()
    case "component/dialog/dialog-26#default":
      return modules["../../../../../registry/variants/source/components/dialog/dialog-26/dialog-26.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
