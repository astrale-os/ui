import { Toggle } from '@astrale-os/ui/toggle'
import { BookmarkIcon } from "lucide-react"

const ToggleDemo = () => {
  return (
    <Toggle aria-label='Toggle bookmark' variant='outline'>
      <BookmarkIcon className='group-aria-pressed/toggle:fill-foreground' />
      Bookmark
    </Toggle>
  )
}

export default ToggleDemo
