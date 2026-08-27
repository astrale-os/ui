import * as React from 'react'

import { cn } from '@astrale-os/ui/class-name'

import { Button } from '@astrale-os/ui/button'

interface GlassButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'render'> {
  children: React.ReactNode
  className?: string
  render?: React.ReactElement
}

function GlassButton({ children, render, className, ...props }: GlassButtonProps) {
  return (
    <Button
      render={render}
      nativeButton={!render}
      className={cn(
        'relative inline-flex h-10 shrink-0 rounded-xl bg-transparent! bg-clip-padding px-6 text-base text-white! active:translate-y-0',

        // Glass effect
        'bg-linear-to-l from-white/15 to-white/25 backdrop-blur-xs',

        'before:pointer-events-none before:absolute before:inset-0 before:size-full before:rounded-[inherit] before:border before:border-transparent before:bg-origin-border',

        // Conic gradient
        'before:bg-[conic-gradient(from_var(--button-angle)_at_50%_50%,rgba(255,255,255,0.5),rgba(255,255,255,0)_10%_43%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0)_73%_93%,rgba(255,255,255,0.5))]',

        // masking
        'before:mask-[linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)] before:mask-exclude before:[mask-clip:content-box,border-box]',

        // Hover
        'before:transition-[--button-angle] before:duration-500 before:ease-in-out hover:before:[--button-angle:-125deg]',

        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export { GlassButton, type GlassButtonProps }
