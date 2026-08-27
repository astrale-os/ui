import { Button } from '@astrale-os/ui/button'
import { ArrowRightIcon } from "lucide-react"

const ButtonIconHoverDemo = () => {
  return (
    <Button className='group'>
      Get In Touch
      <ArrowRightIcon className='transition-transform duration-200 group-hover:translate-x-0.5' />
    </Button>
  )
}

export default ButtonIconHoverDemo
