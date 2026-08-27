import { Button } from '@astrale-os/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@astrale-os/ui/drawer'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'
import { Textarea } from '@astrale-os/ui/textarea'

const DrawerWithSides = () => {
  return (
    <Drawer swipeDirection='right'>
      <DrawerTrigger render={<Button variant='outline' />}>Form</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Sign In</DrawerTitle>
          <DrawerDescription>Fill the form to get full access</DrawerDescription>
        </DrawerHeader>
        <div className='grid flex-1 auto-rows-min gap-6 px-4'>
          <div className='grid gap-3'>
            <Label htmlFor='drawer-demo-name'>Full Name</Label>
            <Input id='drawer-demo-name' placeholder='John Doe' />
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='drawer-demo-email'>Email</Label>
            <Input id='drawer-demo-email' placeholder='john.doe@example.com' />
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='drawer-demo-address'>Address</Label>
            <Input id='drawer-demo-address' placeholder='123 Main St' />
          </div>
          <div className='grid gap-3'>
            <Label htmlFor='drawer-demo-description'>Description</Label>
            <Textarea id='drawer-demo-description' placeholder='Enter a description' />
          </div>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose render={<Button variant='outline' />}>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default DrawerWithSides
