import { CommandPaletteDialog } from './dialog-basic.js'

export default function CommandPaletteDialogPreview() {
  return (
    <CommandPaletteDialog
      actions={[
        { id: 'open', label: 'Open Domain' },
        { id: 'inspect', label: 'Inspect Schema' },
      ]}
      onAction={() => undefined}
    />
  )
}
