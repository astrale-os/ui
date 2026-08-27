import { useState } from 'react'
import { Button } from '@astrale-os/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@astrale-os/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@astrale-os/ui/popover'
import { ChevronDownIcon } from "lucide-react"

const DatePickerDemo = () => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor='date' className='px-1'>
        Date picker
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant='outline' id='date' />} className='w-full justify-between font-normal'>
          {date ? date.toLocaleDateString() : 'Pick a date'}
          <ChevronDownIcon
          />
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={date => {
              setDate(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePickerDemo
