import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/tabs/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/tabs/tabs-01#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-01/tabs-01.preview.tsx"]!()
    case "component/tabs/tabs-02#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-02/tabs-02.preview.tsx"]!()
    case "component/tabs/tabs-03#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-03/tabs-03.preview.tsx"]!()
    case "component/tabs/tabs-04#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-04/tabs-04.preview.tsx"]!()
    case "component/tabs/tabs-05#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-05/tabs-05.preview.tsx"]!()
    case "component/tabs/tabs-06#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-06/tabs-06.preview.tsx"]!()
    case "component/tabs/tabs-07#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-07/tabs-07.preview.tsx"]!()
    case "component/tabs/tabs-08#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-08/tabs-08.preview.tsx"]!()
    case "component/tabs/tabs-09#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-09/tabs-09.preview.tsx"]!()
    case "component/tabs/tabs-10#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-10/tabs-10.preview.tsx"]!()
    case "component/tabs/tabs-11#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-11/tabs-11.preview.tsx"]!()
    case "component/tabs/tabs-12#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-12/tabs-12.preview.tsx"]!()
    case "component/tabs/tabs-13#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-13/tabs-13.preview.tsx"]!()
    case "component/tabs/tabs-14#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-14/tabs-14.preview.tsx"]!()
    case "component/tabs/tabs-15#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-15/tabs-15.preview.tsx"]!()
    case "component/tabs/tabs-16#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-16/tabs-16.preview.tsx"]!()
    case "component/tabs/tabs-17#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-17/tabs-17.preview.tsx"]!()
    case "component/tabs/tabs-18#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-18/tabs-18.preview.tsx"]!()
    case "component/tabs/tabs-19#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-19/tabs-19.preview.tsx"]!()
    case "component/tabs/tabs-20#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-20/tabs-20.preview.tsx"]!()
    case "component/tabs/tabs-21#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-21/tabs-21.preview.tsx"]!()
    case "component/tabs/tabs-22#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-22/tabs-22.preview.tsx"]!()
    case "component/tabs/tabs-23#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-23/tabs-23.preview.tsx"]!()
    case "component/tabs/tabs-24#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-24/tabs-24.preview.tsx"]!()
    case "component/tabs/tabs-25#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-25/tabs-25.preview.tsx"]!()
    case "component/tabs/tabs-26#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-26/tabs-26.preview.tsx"]!()
    case "component/tabs/tabs-27#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-27/tabs-27.preview.tsx"]!()
    case "component/tabs/tabs-28#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-28/tabs-28.preview.tsx"]!()
    case "component/tabs/tabs-29#default":
      return modules["../../../../../registry/variants/source/components/tabs/tabs-29/tabs-29.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
