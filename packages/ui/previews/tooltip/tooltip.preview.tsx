import { Button } from '@astrale-os/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@astrale-os/ui/tooltip'

export const preview = { source: '@shadcn/tooltip' } as const

export default function TooltipPreview() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>Hover or focus</TooltipTrigger>
        <TooltipContent>Exact package subpath</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
