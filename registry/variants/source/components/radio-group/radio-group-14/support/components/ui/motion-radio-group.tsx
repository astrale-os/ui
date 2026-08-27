import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'

import { AnimatePresence, motion, type HTMLMotionProps, type Transition } from 'motion/react'
import { cn } from '@astrale-os/ui/class-name'
import { CircleIcon } from "lucide-react"

type RadioGroupItemProps = RadioPrimitive.Root.Props &
  HTMLMotionProps<'span'> & {
    transition?: Transition
  }

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot='radio-group' className={cn('grid gap-2', className)} {...props} />
}

function RadioGroupItem({
  className,
  transition = { type: 'spring', stiffness: 200, damping: 16 },
  ...props
}: RadioGroupItemProps) {
  return (
    <RadioPrimitive.Root
      {...props}
      render={
        <motion.span
          data-slot='radio-group-item'
          className={cn(
            'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 aspect-square size-5 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
      }
    >
      <RadioPrimitive.Indicator
        data-slot='radio-group-indicator'
        className='relative flex h-full items-center justify-center'
      >
        <AnimatePresence>
          <motion.div
            key='radio-group-indicator-circle'
            data-slot='radio-group-indicator-circle'
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={transition}
          >
            <CircleIcon className='size-3 fill-current text-current' />
          </motion.div>
        </AnimatePresence>
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
