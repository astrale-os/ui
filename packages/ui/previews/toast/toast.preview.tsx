import { Button } from '@astrale-os/ui/button'
import { toast } from '@astrale-os/ui/toast'

export const preview = { canvas: 'compact', source: '@shadcn/toast' } as const

export default function ToastPreview() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast.add({
          title: 'Theme saved',
          description: 'Ready to reuse.',
          type: 'success',
        })
      }
    >
      Send toast
    </Button>
  )
}
