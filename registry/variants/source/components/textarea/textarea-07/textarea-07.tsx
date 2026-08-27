import { useId } from 'react'

import { Label } from '@astrale-os/ui/label'
import { Textarea } from '@astrale-os/ui/textarea'

const TextareaRequiredDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>
        Required textarea <span className='text-destructive'>*</span>
      </Label>
      <Textarea placeholder='Type your feedback here' id={id} required />
    </div>
  )
}

export default TextareaRequiredDemo
