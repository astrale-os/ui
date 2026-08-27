import { useId } from 'react'
import { Label } from '@astrale-os/ui/label'
import { RadioGroup, RadioGroupItem } from '@astrale-os/ui/radio-group'
import { UserIcon, CrownIcon } from "lucide-react"

const RadioGroupCardVerticalRadioDemo = () => {
  const id = useId()

  return (
    <RadioGroup className='w-full max-w-96 justify-items-center sm:grid-cols-2' defaultValue='1'>
      <div className='border-input has-data-checked:border-primary/50 relative flex w-full max-w-50 flex-col items-center gap-3 rounded-md border p-4 shadow-xs outline-none'>
        <RadioGroupItem
          value='1'
          id={`${id}-1`}
          className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
          aria-describedby={`${id}-1-description`}
          aria-label='plan-radio-basic'
        />
        <div className='grid grow justify-items-center gap-2'>
          <UserIcon className='size-6' />
          <Label htmlFor={`${id}-1`} className='justify-center after:absolute after:inset-0'>
            Basic
          </Label>
          <p id={`${id}-1-description`} className='text-muted-foreground text-center text-xs'>
            Get 1 project with 1 team member.
          </p>
        </div>
      </div>
      <div className='border-input has-data-checked:border-primary/50 relative flex w-full max-w-50 flex-col items-center gap-3 rounded-md border p-4 shadow-xs outline-none'>
        <RadioGroupItem
          value='2'
          id={`${id}-2`}
          className='order-1 size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
          aria-describedby={`${id}-2-description`}
          aria-label='plan-radio-premium'
        />
        <div className='grid grow justify-items-center gap-2'>
          <CrownIcon className='size-6' />
          <Label htmlFor={`${id}-2`} className='justify-center after:absolute after:inset-0'>
            Premium
          </Label>
          <p id={`${id}-2-description`} className='text-muted-foreground text-center text-xs'>
            Get 5 projects with 5 team members.
          </p>
        </div>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupCardVerticalRadioDemo
