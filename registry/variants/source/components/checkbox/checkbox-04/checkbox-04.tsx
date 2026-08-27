import { useId } from 'react'

import { Checkbox } from '@astrale-os/ui/checkbox'
import { Label } from '@astrale-os/ui/label'

const CheckboxTodoListDemo = () => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} defaultChecked />
      <Label htmlFor={id} className='peer-data-checked:line-through'>
        Simple todo list item
      </Label>
    </div>
  )
}

export default CheckboxTodoListDemo
