import { CraftButton, CraftButtonIcon, CraftButtonLabel } from '@/components/ui/craft-button'
import { ArrowUpRightIcon } from "lucide-react"

const CraftButtonDemo = () => {
  return (
    <CraftButton>
      <CraftButtonLabel>Click me</CraftButtonLabel>
      <CraftButtonIcon>
        <ArrowUpRightIcon className='size-3 stroke-2 transition-transform duration-500 group-hover/button:rotate-45' />
      </CraftButtonIcon>
    </CraftButton>
  )
}

export default CraftButtonDemo
