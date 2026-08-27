import { useId } from 'react'

import { Checkbox } from '@/components/ui/motion-checkbox'
import { Label } from '@astrale-os/ui/label'

const CheckboxAnimatedTodoListDemo = () => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox
        id={id}
        defaultChecked
        className='rounded-full focus-visible:border-blue-500 focus-visible:ring-blue-500/20 data-checked:border-blue-500! data-checked:bg-blue-500! dark:text-white dark:focus-visible:ring-blue-500/40'
      />
      <Label
        htmlFor={id}
        className='peer-data-checked:text-primary after:bg-primary relative after:absolute after:top-1/2 after:left-0 after:h-px after:w-full after:origin-bottom after:scale-x-0 after:transition-transform after:duration-500 after:ease-in-out peer-data-checked:after:origin-bottom peer-data-checked:after:scale-x-100'
      >
        Animated todo list item
      </Label>
    </div>
  )
}

export default CheckboxAnimatedTodoListDemo
