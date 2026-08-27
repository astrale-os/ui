import { Button } from '@astrale-os/ui/button'
import { ShareIcon } from "lucide-react"

const ButtonPublishDemo = () => {
  return (
    <Button variant='outline' className='h-11 rounded-full px-2'>
      <span className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full'>
        <ShareIcon
        />
      </span>
      Publish
    </Button>
  )
}

export default ButtonPublishDemo
