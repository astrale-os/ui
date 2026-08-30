import { LogViewer } from './log-viewer/log-viewer.js'

export default function LogViewerLoadingPreview() {
  return (
    <div className="flex h-[520px] w-full min-w-0 flex-col">
      <LogViewer isLoading />
    </div>
  )
}

export const preview = {
  canvas: 'wide' as const,
  source:
    'https://raw.githubusercontent.com/Reckless98/logpilot/a0ac783c7dc6c579714f960731a2392043185dc6/src/components/log-viewer.tsx',
}
