import * as React from 'react'

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { motion, type HTMLMotionProps } from 'motion/react'

import { cn } from '@astrale-os/ui/class-name'

type CheckboxProps = CheckboxPrimitive.Root.Props & HTMLMotionProps<'span'>

function Checkbox({ className, onCheckedChange, ...props }: CheckboxProps) {
  const [isChecked, setIsChecked] = React.useState<CheckboxPrimitive.Root.Props['checked']>(
    props?.checked ?? props?.defaultChecked ?? false
  )

  React.useEffect(() => {
    if (props?.checked !== undefined) setIsChecked(props.checked)
  }, [props?.checked])

  const handleCheckedChange = React.useCallback(
    (
      checked: Parameters<NonNullable<CheckboxPrimitive.Root.Props['onCheckedChange']>>[0],
      eventDetails: Parameters<NonNullable<CheckboxPrimitive.Root.Props['onCheckedChange']>>[1]
    ) => {
      setIsChecked(checked)
      onCheckedChange?.(checked, eventDetails)
    },
    [onCheckedChange]
  )

  return (
    <CheckboxPrimitive.Root
      {...props}
      onCheckedChange={handleCheckedChange}
      render={
        <motion.span
          data-slot='checkbox'
          className={cn(
            'peer border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary relative flex size-4 shrink-0 items-center justify-center rounded border transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3',
            className
          )}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        />
      }
    >
      <CheckboxPrimitive.Indicator
        render={
          <motion.svg
            data-slot='checkbox-indicator'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='3.5'
            stroke='currentColor'
            className='size-3.5'
            initial='unchecked'
            animate={isChecked ? 'checked' : 'unchecked'}
          />
        }
      >
        <motion.path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M4.5 12.75l6 6 9-13.5'
          variants={{
            checked: {
              pathLength: 1,
              opacity: 1,
              transition: {
                duration: 0.2,
                delay: 0.2
              }
            },
            unchecked: {
              pathLength: 0,
              opacity: 0,
              transition: {
                duration: 0.2
              }
            }
          }}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
