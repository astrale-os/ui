import * as React from 'react'

import type { VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'

import { buttonVariants } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'

interface BounceButtonProps extends HTMLMotionProps<'button'>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode
}

function BounceButton({ children, className, size, variant, ...props }: BounceButtonProps) {
  return (
    <motion.button
      data-slot='button'
      whileHover={{ scale: 1.1 }}
      className={cn(buttonVariants({ variant, size }), 'transition-none active:translate-y-0', className)}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export { BounceButton, type BounceButtonProps }
