import { Label } from '@astrale-os/ui/label'
import { Switch } from '@astrale-os/ui/switch'

const SwitchDemo = () => {
  return (
    <div className='flex items-center space-x-2'>
      <Switch id='airplane-mode' />
      <Label htmlFor='airplane-mode'>Airplane Mode</Label>
    </div>
  )
}

export default SwitchDemo
