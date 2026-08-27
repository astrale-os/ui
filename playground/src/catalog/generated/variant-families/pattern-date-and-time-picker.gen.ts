import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/date-and-time-picker/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/date-and-time-picker/date-picker-01#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-01/date-picker-01.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-02#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-02/date-picker-02.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-03#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-03/date-picker-03.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-04#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-04/date-picker-04.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-05#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-05/date-picker-05.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-06#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-06/date-picker-06.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-07#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-07/date-picker-07.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-08#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-08/date-picker-08.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-09#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-09/date-picker-09.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-10#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-10/date-picker-10.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-11#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-11/date-picker-11.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-12#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-12/date-picker-12.preview.tsx"]!()
    case "pattern/date-and-time-picker/date-picker-13#default":
      return modules["../../../../../registry/variants/source/patterns/date-and-time-picker/date-picker-13/date-picker-13.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
