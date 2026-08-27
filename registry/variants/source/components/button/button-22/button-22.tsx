import { Button } from '@astrale-os/ui/button'
import { AlertTriangleIcon } from "lucide-react"

const ButtonCautionDemo = () => {
  return (
    <Button className='bg-amber-600/10 text-amber-600 hover:bg-amber-600/20 focus-visible:border-amber-600/40 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-400/20 dark:focus-visible:border-amber-400/40 dark:focus-visible:ring-amber-400/40'>
      <AlertTriangleIcon
      />
      Caution
    </Button>
  )
}

export default ButtonCautionDemo
