import { Button } from '@astrale-os/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@astrale-os/ui/tooltip'

const TooltipDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant='outline' size='sm'>
            Default
          </Button>
        }
      />
      <TooltipContent>
        <p>This is a simple tooltip</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipDemo
