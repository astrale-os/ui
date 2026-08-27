import { Label } from '@astrale-os/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/motion-radio-group'

const RadioGroupAnimatedDemo = () => {
  return (
    <RadioGroup defaultValue='realtime'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='realtime'
          id='notifications-realtime'
          className='data-checked:border-input data-checked:bg-primary-foreground dark:data-checked:bg-primary-foreground [&_[data-slot=radio-group-indicator]>span]:bg-primary'
        />
        <Label htmlFor='notifications-realtime'>Real-time</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='daily'
          id='notifications-daily'
          className='data-checked:border-input data-checked:bg-primary-foreground dark:data-checked:bg-primary-foreground [&_[data-slot=radio-group-indicator]>span]:bg-primary'
        />
        <Label htmlFor='notifications-daily'>Daily Digest</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='none'
          id='notifications-none'
          className='data-checked:border-input data-checked:bg-primary-foreground dark:data-checked:bg-primary-foreground [&_[data-slot=radio-group-indicator]>span]:bg-primary'
        />
        <Label htmlFor='notifications-none'>No Notifications</Label>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupAnimatedDemo
