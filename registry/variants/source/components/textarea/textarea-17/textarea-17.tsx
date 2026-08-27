import { useId } from 'react'

import { Label } from '@astrale-os/ui/label'
import { Textarea } from '@astrale-os/ui/textarea'

const TextareaAutoGrowDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Auto growing textarea</Label>
      <Textarea
        id={id}
        placeholder='Type your feedback here'
        className='field-sizing-content max-h-30 min-h-0 resize-none py-1.75'
      />
    </div>
  )
}

export default TextareaAutoGrowDemo
