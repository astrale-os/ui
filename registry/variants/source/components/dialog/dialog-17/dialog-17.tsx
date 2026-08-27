import { Button } from '@astrale-os/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@astrale-os/ui/dialog'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'

const DialogTopAlignDemo = () => {
  return (
    <Dialog>
      <form>
        <DialogTrigger render={<Button variant='outline' />}>Top align</DialogTrigger>
        <DialogContent className='top-0 mt-6 translate-y-0 sm:max-w-106.25'>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Make changes to your profile here. Click save when you&apos;re done.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>
            <div className='grid gap-3'>
              <Label htmlFor='name-1'>Name</Label>
              <Input id='name-1' name='name' defaultValue='Pedro Duarte' />
            </div>
            <div className='grid gap-3'>
              <Label htmlFor='username-1'>Username</Label>
              <Input id='username-1' name='username' defaultValue='@peduarte' />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant='outline' />}>Cancel</DialogClose>
            <Button type='submit'>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default DialogTopAlignDemo
