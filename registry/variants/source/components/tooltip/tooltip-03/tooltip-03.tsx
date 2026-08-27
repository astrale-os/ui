import { Button } from '@astrale-os/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@astrale-os/ui/tooltip'

const TooltipNoArrowDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant='outline' size='sm'>
            No arrow
          </Button>
        }
      />
      <TooltipContent className='*:last:invisible'>
        <p>This tooltip don&apos;t have arrow</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipNoArrowDemo
