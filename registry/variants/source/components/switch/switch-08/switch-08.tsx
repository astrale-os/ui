import { useState } from 'react'

import { Label } from '@astrale-os/ui/label'
import { Switch } from '@astrale-os/ui/switch'

const SwitchToggleLabelDemo = () => {
  const [checked, setChecked] = useState<boolean>(true)

  return (
    <div className='inline-flex items-center gap-2'>
      <Switch id='toggle-label' checked={checked} onCheckedChange={setChecked} aria-label='Toggle switch label' />
      <Label htmlFor='toggle-label' className='text-sm font-medium'>
        {checked ? 'Yes' : 'No'}
      </Label>
    </div>
  )
}

export default SwitchToggleLabelDemo
