import { useId } from 'react'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@astrale-os/ui/tooltip'
import { InfoIcon } from "lucide-react"

const TooltipWithLabel = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>
        Client ID{' '}
        <Tooltip>
          <TooltipTrigger
            render={
              <InfoIcon className='size-4' />
            }
          />
          <TooltipContent>
            <p>Public identifier for your application.</p>
          </TooltipContent>
        </Tooltip>
      </Label>
      <Input id={id} type='text' placeholder='client_12**56' />
    </div>
  )
}

export default TooltipWithLabel
