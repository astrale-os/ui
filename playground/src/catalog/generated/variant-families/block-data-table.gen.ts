import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/blocks/data-table/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "block/data-table/data-table-01#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-01/data-table-01.preview.tsx"]!()
    case "block/data-table/data-table-02#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-02/data-table-02.preview.tsx"]!()
    case "block/data-table/data-table-03#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-03/data-table-03.preview.tsx"]!()
    case "block/data-table/data-table-04#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-04/data-table-04.preview.tsx"]!()
    case "block/data-table/data-table-05#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-05/data-table-05.preview.tsx"]!()
    case "block/data-table/data-table-06#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-06/data-table-06.preview.tsx"]!()
    case "block/data-table/data-table-07#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-07/data-table-07.preview.tsx"]!()
    case "block/data-table/data-table-08#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-08/data-table-08.preview.tsx"]!()
    case "block/data-table/data-table-09#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-09/data-table-09.preview.tsx"]!()
    case "block/data-table/data-table-10#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-10/data-table-10.preview.tsx"]!()
    case "block/data-table/data-table-11#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-11/data-table-11.preview.tsx"]!()
    case "block/data-table/data-table-12#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-12/data-table-12.preview.tsx"]!()
    case "block/data-table/data-table-13#default":
      return modules["../../../../../registry/variants/source/blocks/data-table/data-table-13/data-table-13.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
