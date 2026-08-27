import { Button } from '@astrale-os/ui/button'
import { Undo2Icon, Redo2Icon } from "lucide-react"

const ButtonIconDemo = () => {
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <Button variant='outline'>
        <Undo2Icon
        />
        Undo
      </Button>
      <Button variant='outline'>
        Redo
        <Redo2Icon
        />
      </Button>
    </div>
  )
}

export default ButtonIconDemo
