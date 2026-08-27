import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/checkbox/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/checkbox/checkbox-01#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-01/checkbox-01.preview.tsx"]!()
    case "component/checkbox/checkbox-02#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-02/checkbox-02.preview.tsx"]!()
    case "component/checkbox/checkbox-03#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-03/checkbox-03.preview.tsx"]!()
    case "component/checkbox/checkbox-04#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-04/checkbox-04.preview.tsx"]!()
    case "component/checkbox/checkbox-05#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-05/checkbox-05.preview.tsx"]!()
    case "component/checkbox/checkbox-06#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-06/checkbox-06.preview.tsx"]!()
    case "component/checkbox/checkbox-07#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-07/checkbox-07.preview.tsx"]!()
    case "component/checkbox/checkbox-08#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-08/checkbox-08.preview.tsx"]!()
    case "component/checkbox/checkbox-09#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-09/checkbox-09.preview.tsx"]!()
    case "component/checkbox/checkbox-10#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-10/checkbox-10.preview.tsx"]!()
    case "component/checkbox/checkbox-11#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-11/checkbox-11.preview.tsx"]!()
    case "component/checkbox/checkbox-12#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-12/checkbox-12.preview.tsx"]!()
    case "component/checkbox/checkbox-13#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-13/checkbox-13.preview.tsx"]!()
    case "component/checkbox/checkbox-14#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-14/checkbox-14.preview.tsx"]!()
    case "component/checkbox/checkbox-15#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-15/checkbox-15.preview.tsx"]!()
    case "component/checkbox/checkbox-16#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-16/checkbox-16.preview.tsx"]!()
    case "component/checkbox/checkbox-17#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-17/checkbox-17.preview.tsx"]!()
    case "component/checkbox/checkbox-18#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-18/checkbox-18.preview.tsx"]!()
    case "component/checkbox/checkbox-19#default":
      return modules["../../../../../registry/variants/source/components/checkbox/checkbox-19/checkbox-19.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
