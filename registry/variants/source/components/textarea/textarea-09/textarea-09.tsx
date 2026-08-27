import { useId } from 'react'

import { Label } from '@astrale-os/ui/label'
import { Textarea } from '@astrale-os/ui/textarea'

const TextareaFilledDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Filled Textarea</Label>
      <Textarea className='bg-muted border-transparent shadow-none' placeholder='Type your feedback here' id={id} />
    </div>
  )
}

export default TextareaFilledDemo
