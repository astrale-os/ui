import { Alert, AlertAction, AlertTitle } from '@astrale-os/ui/alert'
import { Button } from '@astrale-os/ui/button'
import { CircleAlertIcon } from "lucide-react"

const AlertWithActionDemo = () => {
  return (
    <Alert className='*:[svg]:row-span-1'>
      <CircleAlertIcon
      />
      <AlertTitle className='flex-1'>New message!</AlertTitle>
      <AlertAction className='top-1/2 -translate-y-1/2'>
        <Button variant='outline' size='xs' className='cursor-pointer'>
          Open
        </Button>
      </AlertAction>
    </Alert>
  )
}

export default AlertWithActionDemo
