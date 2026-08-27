import { useState } from 'react'
import { Button } from '@astrale-os/ui/button'
import { XIcon, MenuIcon } from "lucide-react"

const IconButtonToggleDemo = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Button variant='ghost' size='icon' onClick={() => setIsOpen(!isOpen)} aria-label='Toggle menu'>
      {isOpen ? (
        <XIcon
        />
      ) : (
        <MenuIcon
        />
      )}
    </Button>
  )
}

export default IconButtonToggleDemo
