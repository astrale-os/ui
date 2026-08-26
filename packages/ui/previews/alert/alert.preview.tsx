import { Alert, AlertDescription, AlertTitle } from '@astrale-os/ui/alert'

export const preview = { canvas: 'compact', source: '@shadcn/alert' } as const

export default function AlertPreview() {
  return (
    <Alert>
      <AlertTitle>Revision ready</AlertTitle>
      <AlertDescription>Every declared Function has qualified.</AlertDescription>
    </Alert>
  )
}
