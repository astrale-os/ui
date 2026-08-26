import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@astrale-os/ui/alert-dialog'
import { Button } from '@astrale-os/ui/button'

export const preview = { source: '@shadcn/alert-dialog' } as const

export default function AlertDialogPreview() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>Revoke grant</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke this grant?</AlertDialogTitle>
          <AlertDialogDescription>
            This action changes authority immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Revoke</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
