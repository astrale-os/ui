import { Button } from '@astrale-os/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@astrale-os/ui/dialog'
import { Input } from '@astrale-os/ui/input'

export const preview = { source: '@shadcn/dialog' } as const

export default function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Domain label</DialogTitle>
          <DialogDescription>Update presentation without changing identity.</DialogDescription>
        </DialogHeader>
        <Input aria-label="Domain label in dialog" value="Observatory" readOnly />
        <DialogFooter showCloseButton>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
