import { useId } from 'react'

import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'

const InputColoredRingDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with colored ring</Label>
      <Input
        id={id}
        type='email'
        placeholder='Email address'
        className='focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:focus-visible:ring-indigo-500/40'
      />
    </div>
  )
}

export default InputColoredRingDemo
