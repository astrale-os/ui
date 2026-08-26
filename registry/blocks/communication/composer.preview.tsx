import { useState } from 'react'

import { ComposerBlock } from './composer.js'

export default function ComposerBlockPreview() {
  const [value, setValue] = useState('The schema revision is ready.')
  const [attachments, setAttachments] = useState([{ id: 'domain', name: 'domain.ts' }])
  return (
    <ComposerBlock
      value={value}
      attachments={attachments}
      onValueChange={setValue}
      onRemoveAttachment={(id) =>
        setAttachments((current) => current.filter((attachment) => attachment.id !== id))
      }
      onSubmit={() => undefined}
    />
  )
}
