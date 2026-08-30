import { LogViewer } from './log-viewer/log-viewer.js'
import { applicationLogStream, logStreamActions } from './observability.fixture.js'

export default function LogViewerStreamErrorPreview() {
  return (
    <div className="flex h-[520px] flex-col">
      <LogViewer
        defaultLogs={applicationLogStream}
        streamError="disconnected from the log gateway"
        {...logStreamActions}
      />
    </div>
  )
}

export const preview = {
  canvas: 'wide' as const,
  source:
    'https://raw.githubusercontent.com/Reckless98/logpilot/a0ac783c7dc6c579714f960731a2392043185dc6/src/components/log-viewer.tsx',
}
