import { useId } from 'react'

import { Label } from '@astrale-os/ui/label'
import { Textarea } from '@astrale-os/ui/textarea'

const TextareaInvalidDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Invalid Textarea</Label>
      <Textarea aria-invalid placeholder='Type your feedback here' id={id} />
      <p className='text-destructive text-xs'>Your feedback is useful for us.</p>
    </div>
  )
}

export default TextareaInvalidDemo
