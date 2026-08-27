import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/input-otp/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/input-otp/input-otp-01#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-01/input-otp-01.preview.tsx"]!()
    case "component/input-otp/input-otp-02#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-02/input-otp-02.preview.tsx"]!()
    case "component/input-otp/input-otp-03#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-03/input-otp-03.preview.tsx"]!()
    case "component/input-otp/input-otp-04#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-04/input-otp-04.preview.tsx"]!()
    case "component/input-otp/input-otp-05#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-05/input-otp-05.preview.tsx"]!()
    case "component/input-otp/input-otp-06#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-06/input-otp-06.preview.tsx"]!()
    case "component/input-otp/input-otp-07#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-07/input-otp-07.preview.tsx"]!()
    case "component/input-otp/input-otp-08#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-08/input-otp-08.preview.tsx"]!()
    case "component/input-otp/input-otp-09#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-09/input-otp-09.preview.tsx"]!()
    case "component/input-otp/input-otp-10#default":
      return modules["../../../../../registry/variants/source/components/input-otp/input-otp-10/input-otp-10.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
