import * as motion from 'motion/react-client'
import { Button } from '@astrale-os/ui/button'
import { ButtonGroup } from '@astrale-os/ui/button-group'
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const ButtonGroupScaleDemo = () => {
  return (
    <ButtonGroup className='*:border-primary *:not-last:border-r-primary-foreground/30 *:bg-clip-border'>
      <Button className='transition-none active:translate-y-0' render={<motion.button whileTap={{ scale: 0.9 }} />}>
        <ChevronLeftIcon
        />
        Previous
      </Button>
      <Button className='transition-none active:translate-y-0' render={<motion.button whileTap={{ scale: 0.9 }} />}>
        Next
        <ChevronRightIcon
        />
      </Button>
    </ButtonGroup>
  )
}

export default ButtonGroupScaleDemo
