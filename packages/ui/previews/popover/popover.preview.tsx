import { Button } from '@astrale-os/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@astrale-os/ui/popover'

export const preview = { source: '@shadcn/popover' } as const

export default function PopoverPreview() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Inspect revision</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Revision a02fa1</PopoverTitle>
          <PopoverDescription>Qualified on all supported runtimes.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}
