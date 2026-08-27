import { Button } from '@astrale-os/ui/button'
import { ButtonGroup } from '@astrale-os/ui/button-group'
import { SettingsIcon, BoxIcon, ChartBarBigIcon } from "lucide-react"

const ButtonGroupGhostDemo = () => {
  return (
    <ButtonGroup>
      <Button variant='ghost'>
        <SettingsIcon
        />
        Settings
      </Button>
      <Button variant='ghost'>
        <BoxIcon
        />
        Dashboard
      </Button>
      <Button variant='ghost'>
        <ChartBarBigIcon
        />
        Analytics
      </Button>
    </ButtonGroup>
  )
}

export default ButtonGroupGhostDemo
