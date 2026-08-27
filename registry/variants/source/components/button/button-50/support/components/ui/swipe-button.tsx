import * as React from 'react'

import { cn } from '@astrale-os/ui/class-name'

import { Button } from '@astrale-os/ui/button'

interface SwipeButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'render'> {
  children: React.ReactNode
  className?: string
  render?: React.ReactElement
}

function PrimarySwipeButton({ children, render, className, ...props }: SwipeButtonProps) {
  return (
    <Button
      render={render}
      nativeButton={!render}
      className={cn(
        'ring-primary/60 hover:bg-primary relative h-10 overflow-hidden rounded-full px-6 text-base shadow-[inset_0_-3px_6px_0px_rgba(255,255,255,0.90)] ring-2 duration-500 text-shadow-xs hover:shadow-[inset_0_-3px_6px_-2px_rgba(255,255,255,0.90)] active:translate-y-0 dark:shadow-[inset_0_-3px_6px_0px_rgba(0,0,0,0.60)] dark:hover:shadow-[inset_0_-3px_6px_-2px_rgba(0,0,0,0.60)]',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

function SecondarySwipeButton({ children, render, className, ...props }: SwipeButtonProps) {
  return (
    <Button
      render={render}
      nativeButton={!render}
      className={cn(
        'bg-primary/10 text-primary ring-primary/60 hover:bg-primary/10 relative h-10 overflow-hidden rounded-full px-6 text-base shadow-[inset_0_-3px_6px_0px_rgba(255,255,255,100)] ring-2 duration-500 hover:shadow-[inset_0_-3px_6px_-2px_rgba(255,255,255,100)] active:translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export { PrimarySwipeButton, SecondarySwipeButton, type SwipeButtonProps }
