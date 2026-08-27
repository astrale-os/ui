'use client'

import { useState } from 'react'

import { type DateRange } from 'react-day-picker'
import { Button } from '@astrale-os/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@astrale-os/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@astrale-os/ui/popover'
import { ChevronDownIcon } from "lucide-react"

const DatePickerRangeDemo = () => {
  const [range, setRange] = useState<DateRange | undefined>(undefined)

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor='dates' className='px-1'>
        Range date picker
      </Label>
      <Popover>
        <PopoverTrigger render={<Button variant='outline' id='dates' />} className='w-full justify-between font-normal'>
          {range?.from && range?.to
            ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
            : 'Pick a date'}
          <ChevronDownIcon
          />
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='range'
            selected={range}
            onSelect={range => {
              setRange(range)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePickerRangeDemo
