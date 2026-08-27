import * as React from 'react'

import { cn } from '@astrale-os/ui/class-name'

import { Button } from '@astrale-os/ui/button'

interface MatterButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'render'> {
  children: React.ReactNode
  className?: string
  render?: React.ReactElement
}

function MatterButton({ children, className, render, ...props }: MatterButtonProps) {
  return (
    <div
      className={cn(
        'bg-background relative inline-flex size-fit shrink-0 overflow-hidden rounded-full p-1 shadow-[inset_-0.5px_-0.5px_1px_0_rgba(0,0,0,0.6)] transition-shadow duration-500 has-hover:shadow-[inset_0_-2px_4px_0_rgba(0,0,0,0.6)] dark:shadow-[inset_-0.5px_-0.5px_1px_0_rgba(255,255,255,0.6)] dark:has-hover:shadow-[inset_0_-2px_4px_0_rgba(255,255,255,0.6)]',
        className
      )}
    >
      <Button
        render={render}
        nativeButton={!render}
        className={cn(
          'relative h-10 overflow-hidden rounded-full border-0 bg-black px-6 text-base text-white duration-500 hover:bg-black active:translate-y-0 [a]:hover:bg-black',

          //Before
          'before:absolute before:inset-0 before:block before:size-full before:rounded-full before:shadow-[inset_0_2px_4.5px_0px_rgba(255,255,255,0.6)] before:duration-300',

          //Hover
          'hover:shadow-[inset_0_-6px_8px_-1px_rgba(25,175,253,0.6)] dark:hover:shadow-[inset_0_-3px_2px_-1px_rgba(25,175,253,0.6)]'
        )}
        {...props}
      >
        {children}
      </Button>
    </div>
  )
}

export { MatterButton, type MatterButtonProps }
