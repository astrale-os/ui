import { useId } from 'react'

import { Label } from '@astrale-os/ui/label'
import { RadioGroup, RadioGroupItem } from '@astrale-os/ui/radio-group'

const RadioGroupCardRadioDemo = () => {
  const id = useId()

  return (
    <RadioGroup className='w-full max-w-96 gap-2' defaultValue='1'>
      <div className='border-input has-data-checked:border-primary/50 relative flex w-full items-center gap-2 rounded-md border p-4 shadow-xs outline-none'>
        <RadioGroupItem
          value='1'
          id={`${id}-1`}
          aria-label='plan-radio-basic'
          aria-describedby={`${id}-1-description`}
          className='size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
        />
        <div className='grid grow gap-2'>
          <Label htmlFor={`${id}-1`} className='justify-between after:absolute after:inset-0'>
            Basic <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>Free</span>
          </Label>
          <p id={`${id}-1-description`} className='text-muted-foreground text-xs'>
            Get 1 project with 1 team member.
          </p>
        </div>
      </div>

      <div className='border-input has-data-checked:border-primary/50 relative flex w-full items-center gap-2 rounded-md border p-4 shadow-xs outline-none'>
        <RadioGroupItem
          value='2'
          id={`${id}-2`}
          aria-describedby={`${id}-2-description`}
          className='size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5'
        />
        <div className='grid grow gap-2'>
          <Label htmlFor={`${id}-2`} className='justify-between after:absolute after:inset-0'>
            Premium <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>$5.00</span>
          </Label>
          <p id={`${id}-2-description`} className='text-muted-foreground text-xs'>
            Get 5 projects with 5 team members.
          </p>
        </div>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupCardRadioDemo
