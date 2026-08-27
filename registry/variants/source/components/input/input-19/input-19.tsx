import { useId } from 'react'

import { Button } from '@astrale-os/ui/button'
import { ButtonGroup } from '@astrale-os/ui/button-group'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'

const InputStartAddOnDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with start add-on</Label>
      <ButtonGroup>
        <Button variant='outline'>https://</Button>
        <Input id={id} placeholder='shadcnstudio.com' className='w-full' />
      </ButtonGroup>
    </div>
  )
}

export default InputStartAddOnDemo
