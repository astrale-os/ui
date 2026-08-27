import { useId } from 'react'

import { Button } from '@astrale-os/ui/button'
import { ButtonGroup } from '@astrale-os/ui/button-group'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'

const InputEndAddOnDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with end add-on</Label>
      <ButtonGroup>
        <Input id={id} placeholder='shadcnstudio.com' />
        <Button variant='outline'>.com</Button>
      </ButtonGroup>
    </div>
  )
}

export default InputEndAddOnDemo
