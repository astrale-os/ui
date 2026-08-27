import { Button } from '@astrale-os/ui/button'
import { Trash2Icon } from "lucide-react"

const ButtonDiscardDemo = () => {
  return (
    <Button
      variant='outline'
      className='border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:border-destructive dark:hover:bg-destructive/10 dark:focus-visible:ring-destructive/40'
    >
      <Trash2Icon
      />
      Discard
    </Button>
  )
}

export default ButtonDiscardDemo
