import { Button } from '@astrale-os/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription
} from '@astrale-os/ui/popover'
import { MapPinIcon, ChevronRightIcon } from "lucide-react"

const PopoverAboutHimalayasDemo = () => {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' size='icon' />}>
        <MapPinIcon
        />
        <span className='sr-only'>About Himalayas</span>
      </PopoverTrigger>
      <PopoverContent className='w-85 p-0'>
        <div className='flex'>
          <PopoverHeader className='gap-2 p-4'>
            <PopoverTitle className='text-base'>About Himalayas</PopoverTitle>
            <PopoverDescription className='text-xs'>
              The Great Himalayan mountain ranges in the Indian sub-continent region.{' '}
            </PopoverDescription>
            <a
              href='https://en.wikipedia.org/wiki/Himalayas'
              target='_blank'
              rel='noopener noreferrer'
              className='flex w-fit text-xs hover:underline'
            >
              Read more
              <ChevronRightIcon className='size-4' />
            </a>
          </PopoverHeader>
          <img
            src='https://lp-cms-production.imgix.net/2021-01/GettyRF_450207051.jpg?height=136'
            alt='the himalayas'
            className='h-34 w-2/5 rounded-r-md object-cover'
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverAboutHimalayasDemo
