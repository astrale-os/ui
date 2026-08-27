import { Badge } from '@astrale-os/ui/badge'
import { Button } from '@astrale-os/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@astrale-os/ui/tooltip'

const TooltipBadgeDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant='outline' size='sm'>
            Badge
          </Button>
        }
      />
      <TooltipContent>
        <div className='flex items-center gap-2'>
          <p>Team plan: $99/month per user.</p>
          <Badge variant='secondary' className='px-1.5 py-px'>
            Trending
          </Badge>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipBadgeDemo
