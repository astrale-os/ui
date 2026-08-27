import { useId } from 'react'

import { Checkbox } from '@astrale-os/ui/checkbox'
import { Label } from '@astrale-os/ui/label'

const CheckboxDashedDemo = () => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} className='border-primary border-dashed' />
      <Label htmlFor={id}>Accept terms and conditions</Label>
    </div>
  )
}

export default CheckboxDashedDemo
