import type { PreviewModule } from '../../previews.js'

const modules = import.meta.glob<PreviewModule>("../../../../../registry/variants/source/patterns/code-block/**/*.preview.tsx")

export function loadPreview(id: string): Promise<PreviewModule> {
  switch (id) {
    case "pattern/code-block/code-block-01#default":
      return modules["../../../../../registry/variants/source/patterns/code-block/code-block-01/code-block-01.preview.tsx"]!()
    case "pattern/code-block/code-block-02#default":
      return modules["../../../../../registry/variants/source/patterns/code-block/code-block-02/code-block-02.preview.tsx"]!()
    case "pattern/code-block/code-block-03#default":
      return modules["../../../../../registry/variants/source/patterns/code-block/code-block-03/code-block-03.preview.tsx"]!()
    case "pattern/code-block/code-block-04#default":
      return modules["../../../../../registry/variants/source/patterns/code-block/code-block-04/code-block-04.preview.tsx"]!()
    case "pattern/code-block/code-block-05#default":
      return modules["../../../../../registry/variants/source/patterns/code-block/code-block-05/code-block-05.preview.tsx"]!()
    case "pattern/code-block/code-block-06#default":
      return modules["../../../../../registry/variants/source/patterns/code-block/code-block-06/code-block-06.preview.tsx"]!()
    case "pattern/code-block/code-block-07#default":
      return modules["../../../../../registry/variants/source/patterns/code-block/code-block-07/code-block-07.preview.tsx"]!()
    default:
      return Promise.reject(new Error(`Unknown variant preview ${id}.`))
  }
}
