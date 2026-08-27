import { useId } from 'react'
import { Button } from '@astrale-os/ui/button'
import { ButtonGroup } from '@astrale-os/ui/button-group'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'
import { DownloadIcon } from "lucide-react"

const InputIconButtonDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Input with icon button</Label>
      <ButtonGroup className='w-full'>
        <Input id={id} type='email' placeholder='Email address' />
        <Button variant='outline' size='icon'>
          <DownloadIcon
          />
          <span className='sr-only'>Download</span>
        </Button>
      </ButtonGroup>
    </div>
  )
}

export default InputIconButtonDemo
