import { Alert, AlertDescription, AlertTitle } from '@astrale-os/ui/alert'
import { CircleAlertIcon } from "lucide-react"

const AlertSolidDemo = () => {
  return (
    <Alert className='bg-primary text-primary-foreground border-none'>
      <CircleAlertIcon
      />
      <AlertTitle>Editing your profile</AlertTitle>
      <AlertDescription className='text-primary-foreground/80'>
        Changes won&apos;t be saved until you click &quot;Update.&quot;
      </AlertDescription>
    </Alert>
  )
}

export default AlertSolidDemo
