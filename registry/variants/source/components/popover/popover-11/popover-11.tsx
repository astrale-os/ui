'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@astrale-os/ui/avatar'
import { Button } from '@astrale-os/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@astrale-os/ui/popover'
import { Separator } from '@astrale-os/ui/separator'
import { BellIcon } from "lucide-react"

const notifications = [
  {
    id: 1,
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    message: 'Harry assigned you task of New API implementation',
    fallback: 'HL',
    time: '15 Minutes'
  },
  {
    id: 2,
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    message: 'Jerry joined team',
    fallback: 'OS',
    time: '35 Minutes'
  },
  {
    id: 3,
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    message: 'Congratulate ruby for married life',
    fallback: 'HR',
    time: '3 days'
  }
]

const PopoverNotificationsDemo = () => {
  const [readMessages, setReadMessages] = useState([3])

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' size='icon' />}>
        <BellIcon
        />
        <span className='sr-only'>Notifications</span>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0'>
        <div className='grid'>
          <div className='flex items-center justify-between gap-2 px-4 py-2.5'>
            <span className='font-medium'>Notifications</span>
            <Button
              variant='secondary'
              className='h-7 rounded-full px-2 py-1 text-xs'
              onClick={() => setReadMessages(notifications.map(item => item.id))}
            >
              Mark as all read
            </Button>
          </div>
          <Separator />
          <ul className='grid gap-4 p-2'>
            {notifications.map(item => (
              <li
                key={item.id}
                className='hover:bg-accent flex items-start gap-2 rounded-lg px-2 py-1.5'
                onClick={() => setReadMessages([...readMessages, item.id])}
              >
                <Avatar className='rounded-lg'>
                  <AvatarImage src={item.image} alt={item.fallback} />
                  <AvatarFallback className='rounded-lg text-xs'>{item.fallback}</AvatarFallback>
                </Avatar>
                <div className='flex-1 space-y-1'>
                  <div className='text-sm font-medium'>{item.message}</div>
                  <p className='text-muted-foreground text-xs'>{`${item.time} ago`}</p>
                </div>
                {!readMessages.includes(item.id) && (
                  <span className='bg-primary block size-2 self-center rounded-full' />
                )}
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverNotificationsDemo
