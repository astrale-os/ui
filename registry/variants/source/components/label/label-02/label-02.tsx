import { useId } from 'react'

import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'

const InputLabelDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with label</Label>
      <Input id={id} type='email' placeholder='Email address' />
    </div>
  )
}

export default InputLabelDemo
