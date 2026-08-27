import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@astrale-os/ui/avatar'
import { Button } from '@astrale-os/ui/button'

const SonnerWithAvatarDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast(
          <div className='flex items-center gap-2'>
            <Avatar>
              <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
              <AvatarFallback className='text-xs'>HR</AvatarFallback>
            </Avatar>
            Hey Henry Richer, your profile is now up to date!
          </div>
        )
      }
    >
      Toast with avatar
    </Button>
  )
}

export default SonnerWithAvatarDemo
