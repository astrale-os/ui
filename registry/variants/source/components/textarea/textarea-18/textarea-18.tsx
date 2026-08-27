import { useId } from 'react'

import { Label } from '@astrale-os/ui/label'
import { Textarea } from '@astrale-os/ui/textarea'

const TextareaNoResizeDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>No resize textarea</Label>
      <Textarea id={id} placeholder='Type your feedback here' className='resize-none' />
    </div>
  )
}

export default TextareaNoResizeDemo
