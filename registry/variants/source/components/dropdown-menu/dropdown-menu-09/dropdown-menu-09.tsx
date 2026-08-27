import { Button } from '@astrale-os/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@astrale-os/ui/dropdown-menu'
import { PencilLineIcon, UploadIcon, Trash2Icon } from "lucide-react"

const DropdownMenuAlignStartDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline'>Align Start</Button>} />
      <DropdownMenuContent className='w-34'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PencilLineIcon
            />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UploadIcon
            />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive'>
            <Trash2Icon
            />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuAlignStartDemo
