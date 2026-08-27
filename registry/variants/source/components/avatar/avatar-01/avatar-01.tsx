import { Avatar, AvatarFallback, AvatarImage } from '@astrale-os/ui/avatar'

const AvatarDemo = () => {
  return (
    <Avatar>
      <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
      <AvatarFallback>HR</AvatarFallback>
    </Avatar>
  )
}

export default AvatarDemo
