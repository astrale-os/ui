import { useId } from 'react'

import { Label } from '@astrale-os/ui/label'
import { Textarea } from '@astrale-os/ui/textarea'

const TextareaWithHintTextDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <div className='flex items-center justify-between gap-1'>
        <Label htmlFor={id}>Input with hint text</Label>
        <span className='text-muted-foreground text-xs'>Optional field</span>
      </div>
      <Textarea placeholder='Type your feedback here' id={id} />
    </div>
  )
}

export default TextareaWithHintTextDemo
