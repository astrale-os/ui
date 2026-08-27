import { useId } from 'react'

import { Label } from '@astrale-os/ui/label'
import { Textarea } from '@astrale-os/ui/textarea'

const TextareaDisabledDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Disabled textarea</Label>
      <Textarea placeholder='Type your feedback here' disabled id={id} />
    </div>
  )
}

export default TextareaDisabledDemo
