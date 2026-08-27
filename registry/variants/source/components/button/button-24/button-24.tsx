import { Button } from '@astrale-os/ui/button'
import { ShieldXIcon, ShieldCheckIcon } from "lucide-react"

const ButtonPermissionsDemo = () => {
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <Button variant='destructive'>
        Reject
        <ShieldXIcon
        />
      </Button>
      <Button className='bg-green-600/10 text-green-600 hover:bg-green-600/20 focus-visible:border-green-600/40 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20 dark:focus-visible:border-green-400/40 dark:focus-visible:ring-green-400/40'>
        Approve
        <ShieldCheckIcon
        />
      </Button>
    </div>
  )
}

export default ButtonPermissionsDemo
