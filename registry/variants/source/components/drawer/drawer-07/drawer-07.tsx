import * as React from 'react'

import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'

import { Button } from '@astrale-os/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger
} from '@astrale-os/ui/drawer'
import { cn } from '@astrale-os/ui/class-name'

interface CustomDrawerContentProps extends React.ComponentProps<typeof DrawerPrimitive.Popup> {
  overlayClassName?: string
}

function CustomDrawerContent({ children, overlayClassName, className, ...props }: CustomDrawerContentProps) {
  return (
    <DrawerPortal>
      <DrawerOverlay className={overlayClassName} />
      <DrawerPrimitive.Popup
        data-slot='drawer-content'
        className={cn(
          'bg-background fixed z-50 flex h-auto flex-col text-sm',
          'data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:rounded-l-xl data-[swipe-direction=right]:border-l data-[swipe-direction=right]:sm:max-w-sm',
          className
        )}
        {...props}
      >
        <div className='mx-auto hidden shrink-0 group-data-[swipe-direction=down]/drawer-content:block' />
        {children}
      </DrawerPrimitive.Popup>
    </DrawerPortal>
  )
}

const DrawerCustomOverlay = () => {
  return (
    <Drawer swipeDirection='right'>
      <DrawerTrigger render={<Button variant='outline' />}>Custom Overlay</DrawerTrigger>
      <CustomDrawerContent overlayClassName='bg-indigo-600/20 dark:bg-indigo-400/20'>
        <DrawerHeader>
          <DrawerTitle>Drawer Title</DrawerTitle>
          <DrawerDescription>Drawer Description</DrawerDescription>
        </DrawerHeader>
        <p className='px-4'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit ducimus nulla, rem inventore sapiente
          accusantium.
        </p>
        <DrawerFooter>
          <DrawerClose render={<Button variant='outline' />}>Close</DrawerClose>
        </DrawerFooter>
      </CustomDrawerContent>
    </Drawer>
  )
}

export default DrawerCustomOverlay
