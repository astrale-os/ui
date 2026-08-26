import { TypographyDenseData } from './dense-data.js'

export const preview = { canvas: 'wide' } as const

export default function TypographyDenseDataPreview() {
  return (
    <TypographyDenseData title="Qualification" summary="3 checks">
      <pre>
        contracts pass{`\n`}registry pass{`\n`}browser pass
      </pre>
    </TypographyDenseData>
  )
}
