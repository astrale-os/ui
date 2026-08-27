import { Button } from '@astrale-os/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@astrale-os/ui/dropdown-menu'
import { UserIcon, SettingsIcon, ReceiptIcon, DollarSignIcon, CircleHelpIcon } from "lucide-react"

const DropdownMenuItemIconDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline'>Menu item with icon</Button>} />
      <DropdownMenuContent className='w-56'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>User Profile</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon
            />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon
            />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ReceiptIcon
            />
            Billing Plans
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DollarSignIcon
            />
            Pricing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CircleHelpIcon
            />
            FAQ
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuItemIconDemo
