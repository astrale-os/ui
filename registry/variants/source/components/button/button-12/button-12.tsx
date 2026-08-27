import { Button } from '@astrale-os/ui/button'
import { ZapIcon } from "lucide-react"

const ButtonUpgradeDemo = () => {
  return (
    <Button className='border-0 bg-transparent bg-linear-to-r from-amber-600 via-amber-600/60 to-amber-600 bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center] focus-visible:ring-amber-600/20 dark:from-amber-400 dark:via-amber-400/60 dark:to-amber-400 dark:focus-visible:ring-amber-400/40'>
      Upgrade{' '}
      <ZapIcon
      />
    </Button>
  )
}

export default ButtonUpgradeDemo
