import { Checkbox } from '@astrale-os/ui/checkbox'
import { Label } from '@astrale-os/ui/label'

const LabelDemoCheckbox = () => {
  return (
    <div className='flex gap-2'>
      <Checkbox id='terms' />
      <Label htmlFor='terms'>Accept terms and conditions</Label>
    </div>
  )
}

export default LabelDemoCheckbox
