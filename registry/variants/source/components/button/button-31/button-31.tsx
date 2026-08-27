import { Button } from '@astrale-os/ui/button'
import { BookmarkIcon } from "lucide-react"

const IconButtonDemo = () => {
  return (
    <Button variant='outline' size='icon'>
      <BookmarkIcon
      />
      <span className='sr-only'>Bookmark</span>
    </Button>
  )
}

export default IconButtonDemo
