// Regression fixture: the Toaster mounts its portal at startup, before any dialog, so a toast
// raised while a modal dialog is open must still render above the dialog backdrop.
import { Button } from '@astrale-os/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@astrale-os/ui/dialog'
import '@astrale-os/ui/reset.css'
import '@astrale-os/ui/theme.css'
import '@astrale-os/ui/presets/astrale.css'
import { createToastManager, Toaster } from '@astrale-os/ui/toast'
import React from 'react'
import ReactDOM from 'react-dom/client'

const toastManager = createToastManager()

function Fixture() {
  const [undone, setUndone] = React.useState(false)
  return (
    <Toaster toastManager={toastManager}>
      <Dialog>
        <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Publish revision</DialogTitle>
          <DialogDescription>
            {undone ? 'Publication undone' : 'Ready to publish'}
          </DialogDescription>
          <Button
            onClick={() =>
              toastManager.add({
                title: 'Revision published',
                description: 'The revision is live.',
                timeout: 0,
                actionProps: { children: 'Undo', onClick: () => setUndone(true) },
              })
            }
          >
            Publish
          </Button>
        </DialogContent>
      </Dialog>
    </Toaster>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Fixture />
  </React.StrictMode>,
)
