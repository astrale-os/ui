import { Button } from '@astrale-os/ui/button'

const ButtonAnimatedLinkDemo = () => {
  return (
    <Button
      variant='link'
      render={<a href='#' />}
      nativeButton={false}
      className='after:bg-primary relative no-underline! after:absolute after:bottom-1 after:h-px after:w-3/4 after:origin-bottom-right after:scale-x-0 after:transition-transform after:duration-300 after:ease-in-out hover:after:origin-bottom-left hover:after:scale-x-100'
    >
      Contact Us
    </Button>
  )
}

export default ButtonAnimatedLinkDemo
