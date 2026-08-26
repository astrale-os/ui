import { CompactCommandShell } from './compact-command.js'

export default function CompactCommandShellPreview() {
  return (
    <CompactCommandShell
      actions={[
        { id: 'open', label: 'Open Domain' },
        { id: 'inspect', label: 'Inspect Schema' },
      ]}
      currentTitle="UI catalog"
      onAction={() => undefined}
    >
      <p>Select a command to inspect the current surface.</p>
    </CompactCommandShell>
  )
}
