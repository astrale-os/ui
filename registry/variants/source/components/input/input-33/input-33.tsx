import { useId } from 'react'

import { Button } from '@astrale-os/ui/button'
import { ButtonGroup } from '@astrale-os/ui/button-group'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'

const InputEndButtonDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end button</Label>
      <ButtonGroup className='w-full'>
        <Input id={id} type='email' placeholder='Email address' />
        <Button>Subscribe</Button>
      </ButtonGroup>
    </div>
  )
}

export default InputEndButtonDemo
