import { Button } from '@astrale-os/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@astrale-os/ui/tooltip'

const TooltipRoundedDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant='outline' size='sm'>
            Rounded
          </Button>
        }
      />
      <TooltipContent className='rounded-full'>
        <p>This tooltip is rounded</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipRoundedDemo
