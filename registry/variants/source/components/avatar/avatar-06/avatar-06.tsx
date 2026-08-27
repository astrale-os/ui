import { Avatar, AvatarFallback } from '@astrale-os/ui/avatar'
import { HomeIcon } from "lucide-react"

const AvatarIconDemo = () => {
  return (
    <Avatar className='after:border-indigo-500/10'>
      <AvatarFallback className='bg-indigo-500/10 text-indigo-500'>
        <HomeIcon className='size-4' />
      </AvatarFallback>
    </Avatar>
  )
}

export default AvatarIconDemo
