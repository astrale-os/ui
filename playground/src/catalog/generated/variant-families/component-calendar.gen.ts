import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/components/calendar/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "component/calendar/calendar-01#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-01/calendar-01.preview.tsx"]!()
    case "component/calendar/calendar-02#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-02/calendar-02.preview.tsx"]!()
    case "component/calendar/calendar-03#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-03/calendar-03.preview.tsx"]!()
    case "component/calendar/calendar-04#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-04/calendar-04.preview.tsx"]!()
    case "component/calendar/calendar-05#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-05/calendar-05.preview.tsx"]!()
    case "component/calendar/calendar-06#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-06/calendar-06.preview.tsx"]!()
    case "component/calendar/calendar-07#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-07/calendar-07.preview.tsx"]!()
    case "component/calendar/calendar-08#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-08/calendar-08.preview.tsx"]!()
    case "component/calendar/calendar-09#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-09/calendar-09.preview.tsx"]!()
    case "component/calendar/calendar-10#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-10/calendar-10.preview.tsx"]!()
    case "component/calendar/calendar-11#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-11/calendar-11.preview.tsx"]!()
    case "component/calendar/calendar-12#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-12/calendar-12.preview.tsx"]!()
    case "component/calendar/calendar-13#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-13/calendar-13.preview.tsx"]!()
    case "component/calendar/calendar-14#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-14/calendar-14.preview.tsx"]!()
    case "component/calendar/calendar-15#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-15/calendar-15.preview.tsx"]!()
    case "component/calendar/calendar-16#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-16/calendar-16.preview.tsx"]!()
    case "component/calendar/calendar-17#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-17/calendar-17.preview.tsx"]!()
    case "component/calendar/calendar-18#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-18/calendar-18.preview.tsx"]!()
    case "component/calendar/calendar-19#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-19/calendar-19.preview.tsx"]!()
    case "component/calendar/calendar-20#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-20/calendar-20.preview.tsx"]!()
    case "component/calendar/calendar-21#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-21/calendar-21.preview.tsx"]!()
    case "component/calendar/calendar-22#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-22/calendar-22.preview.tsx"]!()
    case "component/calendar/calendar-23#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-23/calendar-23.preview.tsx"]!()
    case "component/calendar/calendar-24#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-24/calendar-24.preview.tsx"]!()
    case "component/calendar/calendar-25#default":
      return modules["../../../../../registry/variants/source/components/calendar/calendar-25/calendar-25.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
