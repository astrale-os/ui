import { useState } from 'react'
import { Button } from '@astrale-os/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@astrale-os/ui/popover'
import { ChevronDownIcon } from "lucide-react"

const DatePickerAndTimeRangePicker = () => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex w-full max-w-xs flex-col gap-2'>
        <Label htmlFor='date' className='px-1'>
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button variant='outline' id='date' />}
            className='w-full justify-between font-normal'
          >
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
      <div className='flex gap-4'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='time-from' className='px-1'>
            From
          </Label>
          <Input
            type='time'
            id='time-from'
            step='1'
            defaultValue='01:30:00'
            className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='time-to' className='px-1'>
            To
          </Label>
          <Input
            type='time'
            id='time-to'
            step='1'
            defaultValue='02:30:00'
            className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
        </div>
      </div>
    </div>
  )
}

export default DatePickerAndTimeRangePicker
