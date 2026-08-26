import { Button } from '@astrale-os/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@astrale-os/ui/sheet'

export const preview = { source: '@shadcn/sheet' } as const

export default function SheetPreview() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open inspector</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Theme inspector</SheetTitle>
          <SheetDescription>Every semantic token remains host-addressable.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
