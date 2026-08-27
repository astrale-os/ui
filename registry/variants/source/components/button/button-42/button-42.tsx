import * as motion from 'motion/react-client'

import { Button } from '@astrale-os/ui/button'

const ButtonTapAnimationDemo = () => {
  return (
    <Button
      render={<motion.button whileTap={{ scale: 0.85 }} />}
      className='transition-none active:translate-y-0'
      nativeButton={true}
    >
      Tap Animation
    </Button>
  )
}

export default ButtonTapAnimationDemo
