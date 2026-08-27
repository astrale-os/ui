import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/select/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/select/select-01#default":
      return modules["../../../../../registry/variants/source/components/select/select-01/select-01.preview.tsx"]!()
    case "component/select/select-02#default":
      return modules["../../../../../registry/variants/source/components/select/select-02/select-02.preview.tsx"]!()
    case "component/select/select-03#default":
      return modules["../../../../../registry/variants/source/components/select/select-03/select-03.preview.tsx"]!()
    case "component/select/select-04#default":
      return modules["../../../../../registry/variants/source/components/select/select-04/select-04.preview.tsx"]!()
    case "component/select/select-05#default":
      return modules["../../../../../registry/variants/source/components/select/select-05/select-05.preview.tsx"]!()
    case "component/select/select-06#default":
      return modules["../../../../../registry/variants/source/components/select/select-06/select-06.preview.tsx"]!()
    case "component/select/select-07#default":
      return modules["../../../../../registry/variants/source/components/select/select-07/select-07.preview.tsx"]!()
    case "component/select/select-08#default":
      return modules["../../../../../registry/variants/source/components/select/select-08/select-08.preview.tsx"]!()
    case "component/select/select-09#default":
      return modules["../../../../../registry/variants/source/components/select/select-09/select-09.preview.tsx"]!()
    case "component/select/select-10#default":
      return modules["../../../../../registry/variants/source/components/select/select-10/select-10.preview.tsx"]!()
    case "component/select/select-11#default":
      return modules["../../../../../registry/variants/source/components/select/select-11/select-11.preview.tsx"]!()
    case "component/select/select-12#default":
      return modules["../../../../../registry/variants/source/components/select/select-12/select-12.preview.tsx"]!()
    case "component/select/select-13#default":
      return modules["../../../../../registry/variants/source/components/select/select-13/select-13.preview.tsx"]!()
    case "component/select/select-14#default":
      return modules["../../../../../registry/variants/source/components/select/select-14/select-14.preview.tsx"]!()
    case "component/select/select-15#default":
      return modules["../../../../../registry/variants/source/components/select/select-15/select-15.preview.tsx"]!()
    case "component/select/select-16#default":
      return modules["../../../../../registry/variants/source/components/select/select-16/select-16.preview.tsx"]!()
    case "component/select/select-17#default":
      return modules["../../../../../registry/variants/source/components/select/select-17/select-17.preview.tsx"]!()
    case "component/select/select-18#default":
      return modules["../../../../../registry/variants/source/components/select/select-18/select-18.preview.tsx"]!()
    case "component/select/select-19#default":
      return modules["../../../../../registry/variants/source/components/select/select-19/select-19.preview.tsx"]!()
    case "component/select/select-20#default":
      return modules["../../../../../registry/variants/source/components/select/select-20/select-20.preview.tsx"]!()
    case "component/select/select-21#default":
      return modules["../../../../../registry/variants/source/components/select/select-21/select-21.preview.tsx"]!()
    case "component/select/select-22#default":
      return modules["../../../../../registry/variants/source/components/select/select-22/select-22.preview.tsx"]!()
    case "component/select/select-23#default":
      return modules["../../../../../registry/variants/source/components/select/select-23/select-23.preview.tsx"]!()
    case "component/select/select-24#default":
      return modules["../../../../../registry/variants/source/components/select/select-24/select-24.preview.tsx"]!()
    case "component/select/select-25#default":
      return modules["../../../../../registry/variants/source/components/select/select-25/select-25.preview.tsx"]!()
    case "component/select/select-26#default":
      return modules["../../../../../registry/variants/source/components/select/select-26/select-26.preview.tsx"]!()
    case "component/select/select-27#default":
      return modules["../../../../../registry/variants/source/components/select/select-27/select-27.preview.tsx"]!()
    case "component/select/select-28#default":
      return modules["../../../../../registry/variants/source/components/select/select-28/select-28.preview.tsx"]!()
    case "component/select/select-29#default":
      return modules["../../../../../registry/variants/source/components/select/select-29/select-29.preview.tsx"]!()
    case "component/select/select-30#default":
      return modules["../../../../../registry/variants/source/components/select/select-30/select-30.preview.tsx"]!()
    case "component/select/select-31#default":
      return modules["../../../../../registry/variants/source/components/select/select-31/select-31.preview.tsx"]!()
    case "component/select/select-32#default":
      return modules["../../../../../registry/variants/source/components/select/select-32/select-32.preview.tsx"]!()
    case "component/select/select-33#default":
      return modules["../../../../../registry/variants/source/components/select/select-33/select-33.preview.tsx"]!()
    case "component/select/select-34#default":
      return modules["../../../../../registry/variants/source/components/select/select-34/select-34.preview.tsx"]!()
    case "component/select/select-35#default":
      return modules["../../../../../registry/variants/source/components/select/select-35/select-35.preview.tsx"]!()
    case "component/select/select-36#default":
      return modules["../../../../../registry/variants/source/components/select/select-36/select-36.preview.tsx"]!()
    case "component/select/select-37#default":
      return modules["../../../../../registry/variants/source/components/select/select-37/select-37.preview.tsx"]!()
    case "component/select/select-38#default":
      return modules["../../../../../registry/variants/source/components/select/select-38/select-38.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
