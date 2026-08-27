import { Button } from '@astrale-os/ui/button'
import { TrashIcon } from "lucide-react"

const ButtonDeleteDemo = () => {
  return (
    <Button className='from-destructive via-destructive/60 to-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 border-0 bg-transparent bg-linear-to-r bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center]'>
      <TrashIcon
      />
      Delete
    </Button>
  )
}

export default ButtonDeleteDemo
