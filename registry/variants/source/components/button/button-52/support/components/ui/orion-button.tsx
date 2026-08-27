import * as React from 'react'

import { Button } from '@astrale-os/ui/button'

import { cn } from '@astrale-os/ui/class-name'

interface OrionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'render'> {
  children: React.ReactNode
  className?: string
  render?: React.ReactElement
}

function PrimaryOrionButton({ children, render, className, ...props }: OrionButtonProps) {
  return (
    <Button
      render={render}
      nativeButton={!render}
      className={cn(
        '[a]:hover:bg-primary hover:bg-primary h-10 rounded-md border-0 px-6 text-base shadow-[inset_0_2px_3px_0_var(--primary),inset_2px_-4px_4px_0_rgba(0,0,0,0.25),inset_-2px_4px_4px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_0_var(--primary),inset_1px_-1.5px_2px_0_rgba(0,0,0,0.25),inset_-1px_1.5px_2px_0_rgba(255,255,255,0.35)] active:translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

function SecondaryOrionButton({ children, render, className, ...props }: OrionButtonProps) {
  return (
    <Button
      variant='secondary'
      render={render}
      nativeButton={!render}
      className={cn(
        'bg-secondary text-secondary-foreground hover:bg-secondary h-10 rounded-md border-0 px-6 text-base shadow-[inset_0_2px_3px_0_var(--secondary),inset_2px_-4px_4px_0_rgba(0,0,0,0.25),inset_-2px_4px_4px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_0_var(--secondary),inset_1px_-1.5px_2px_0_rgba(0,0,0,0.25),inset_-1px_1.5px_2px_0_rgba(255,255,255,0.35)] active:translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export { PrimaryOrionButton, SecondaryOrionButton, type OrionButtonProps }
