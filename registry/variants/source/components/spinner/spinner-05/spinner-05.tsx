import { Button } from '@astrale-os/ui/button'
import { Spinner } from '@astrale-os/ui/spinner'

const SpinnerButtonDemo = () => {
  return (
    <div className='flex items-center gap-4'>
      {/* Save Action (Primary) */}
      <Button disabled>
        <Spinner />
        Saving...
      </Button>

      {/* Delete Confirm (Destructive) */}
      <Button variant='destructive'>
        <Spinner />
        Deleting...
      </Button>

      {/* Compact Icon Button */}
      <Button className='rounded-md' size='icon'>
        <Spinner className='size-4' />
      </Button>
    </div>
  )
}

export default SpinnerButtonDemo
