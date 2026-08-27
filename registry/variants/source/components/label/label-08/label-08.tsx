import { Label } from '@astrale-os/ui/label'
import { Switch } from '@astrale-os/ui/switch'

const SwitchLabelDemo = () => {
  return (
    <div className='flex items-center space-x-2'>
      <Switch id='do-not-disturb' />
      <Label htmlFor='do-not-disturb'>Do Not Disturb</Label>
    </div>
  )
}

export default SwitchLabelDemo
