import { Alert, AlertDescription, AlertTitle } from '@astrale-os/ui/alert'
import { CheckCheckIcon } from "lucide-react"

const AlertSolidSuccessDemo = () => {
  return (
    <Alert className='border-none bg-green-600 text-white dark:bg-green-400'>
      <CheckCheckIcon
      />
      <AlertTitle>Profile updated</AlertTitle>
      <AlertDescription className='text-white/80'>Your changes have been saved successfully.</AlertDescription>
    </Alert>
  )
}

export default AlertSolidSuccessDemo
