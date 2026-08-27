import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/sonner/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/sonner/sonner-01#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-01/sonner-01.preview.tsx"]!()
    case "component/sonner/sonner-02#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-02/sonner-02.preview.tsx"]!()
    case "component/sonner/sonner-03#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-03/sonner-03.preview.tsx"]!()
    case "component/sonner/sonner-04#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-04/sonner-04.preview.tsx"]!()
    case "component/sonner/sonner-05#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-05/sonner-05.preview.tsx"]!()
    case "component/sonner/sonner-06#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-06/sonner-06.preview.tsx"]!()
    case "component/sonner/sonner-07#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-07/sonner-07.preview.tsx"]!()
    case "component/sonner/sonner-08#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-08/sonner-08.preview.tsx"]!()
    case "component/sonner/sonner-09#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-09/sonner-09.preview.tsx"]!()
    case "component/sonner/sonner-10#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-10/sonner-10.preview.tsx"]!()
    case "component/sonner/sonner-11#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-11/sonner-11.preview.tsx"]!()
    case "component/sonner/sonner-12#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-12/sonner-12.preview.tsx"]!()
    case "component/sonner/sonner-13#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-13/sonner-13.preview.tsx"]!()
    case "component/sonner/sonner-14#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-14/sonner-14.preview.tsx"]!()
    case "component/sonner/sonner-15#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-15/sonner-15.preview.tsx"]!()
    case "component/sonner/sonner-16#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-16/sonner-16.preview.tsx"]!()
    case "component/sonner/sonner-17#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-17/sonner-17.preview.tsx"]!()
    case "component/sonner/sonner-18#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-18/sonner-18.preview.tsx"]!()
    case "component/sonner/sonner-19#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-19/sonner-19.preview.tsx"]!()
    case "component/sonner/sonner-20#default":
      return modules["../../../../../registry/variants/source/components/sonner/sonner-20/sonner-20.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
