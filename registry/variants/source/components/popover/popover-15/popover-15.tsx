import { Avatar, AvatarFallback, AvatarImage } from '@astrale-os/ui/avatar'
import { Button } from '@astrale-os/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@astrale-os/ui/popover'

const PopoverZoomInDemo = () => {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' />}>Zoom in</PopoverTrigger>
      <PopoverContent className='data-open:zoom-in-0! data-closed:zoom-out-0! origin-center duration-400'>
        <div className='grid gap-4'>
          <div className='flex flex-col items-center gap-2'>
            <Avatar className='size-20'>
              <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Howard Lloyd' />
              <AvatarFallback className='text-xs'>HL</AvatarFallback>
            </Avatar>
            <div className='flex flex-col items-center text-center'>
              <p className='text-lg font-semibold'>Howard Lloyd</p>
              <span className='text-sm'>@iamhoward</span>
            </div>
          </div>
          <div className='from-border/20 via-border to-border/20 mx-auto h-px w-45 bg-linear-to-r' />
          <p className='text-center text-sm italic'>
            Product Manager @oliviasparks, passionate about building user-centric solutions that solve real problems.
          </p>
          <div className='flex justify-center gap-2 text-sm'>
            <div className='font-medium'>
              512 <span className='text-muted-foreground font-normal'>followers</span>
            </div>
            <div className='font-medium'>
              128 <span className='text-muted-foreground font-normal'>following</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverZoomInDemo
