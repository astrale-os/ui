import { Badge } from '@astrale-os/ui/badge'
import { Button } from '@astrale-os/ui/button'
import { BellIcon } from "lucide-react"

const ButtonNotificationsBadgeDemo = () => {
  return (
    <Button variant='outline' className='relative'>
      <BellIcon
      />
      Notifications
      <Badge variant='destructive' className='absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1 tabular-nums'>
        8
      </Badge>
    </Button>
  )
}

export default ButtonNotificationsBadgeDemo
