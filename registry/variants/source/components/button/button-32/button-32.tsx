import { Button } from '@astrale-os/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@astrale-os/ui/tooltip'
import { PlusIcon } from "lucide-react"

const IconButtonTooltipDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant='outline' size='icon' className='rounded-full' />}>
        <PlusIcon
        />
        <span className='sr-only'>Add new item</span>
      </TooltipTrigger>
      <TooltipContent className='px-2 py-1 text-xs'>Add new item</TooltipContent>
    </Tooltip>
  )
}

export default IconButtonTooltipDemo
