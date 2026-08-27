import { Button } from '@astrale-os/ui/button'
import { ShieldAlertIcon } from "lucide-react"

const IconButtonGradientDemo = () => {
  return (
    <Button
      size='icon'
      className='from-destructive via-destructive/60 to-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-linear-to-r bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center]'
    >
      <ShieldAlertIcon
      />
      <span className='sr-only'>Security</span>
    </Button>
  )
}

export default IconButtonGradientDemo
