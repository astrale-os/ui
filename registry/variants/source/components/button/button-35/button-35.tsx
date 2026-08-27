import { Badge } from '@astrale-os/ui/badge'
import { Button } from '@astrale-os/ui/button'
import { MailCheckIcon } from "lucide-react"

const IconButtonBadgeDemo = () => {
  return (
    <Button variant='outline' size='icon' className='relative'>
      <MailCheckIcon
      />
      <span className='sr-only'>Messages</span>
      <Badge variant='destructive' className='absolute -top-2.5 -right-2.5 min-w-5 px-1 tabular-nums'>
        8
      </Badge>
    </Button>
  )
}

export default IconButtonBadgeDemo
