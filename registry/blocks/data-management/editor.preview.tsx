import { useState } from 'react'

import { RecordEditor } from './editor.js'

export default function RecordEditorPreview() {
  const [values, setValues] = useState<Record<string, string>>({ name: 'Observatory' })
  return (
    <RecordEditor
      title="Edit Domain"
      fields={[{ id: 'name', label: 'Name', required: true }]}
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      onCancel={() => undefined}
      onSave={() => undefined}
    />
  )
}
