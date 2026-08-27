import { Badge } from '@astrale-os/ui/badge'
import { Button } from '@astrale-os/ui/button'
import { MailCheckIcon } from "lucide-react"

const ButtonMessagesBadgeDemo = () => {
  return (
    <Button variant='outline'>
      <MailCheckIcon
      />
      Messages
      <Badge variant='destructive' className='px-1.5 py-px'>
        99+
      </Badge>
    </Button>
  )
}

export default ButtonMessagesBadgeDemo
