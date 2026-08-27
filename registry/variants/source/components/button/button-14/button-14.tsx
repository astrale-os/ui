import { Button } from '@astrale-os/ui/button'
import { DownloadIcon } from "lucide-react"

const ButtonDownloadDemo = () => {
  return (
    <Button variant='outline' className='border-primary dark:border-primary border-dashed shadow-none'>
      <DownloadIcon
      />
      Download
    </Button>
  )
}

export default ButtonDownloadDemo
