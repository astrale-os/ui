import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@astrale-os/ui/resizable'

export const preview = { canvas: 'wide', source: '@shadcn/resizable' } as const

export default function ResizablePreview() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="resizable-specimen">
      <ResizablePanel defaultSize="55%">
        <span>Preview</span>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="45%">
        <span>Inspector</span>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
