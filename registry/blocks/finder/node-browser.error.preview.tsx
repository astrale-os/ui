import { failingFinderSource } from './finder.fixture.js'
import { NodeBrowser } from './node-browser.js'

export const preview = { canvas: 'wide' } as const

export default function NodeBrowserErrorPreview() {
  return (
    <NodeBrowser
      source={failingFinderSource}
      onConfirm={() => undefined}
      onCancel={() => undefined}
      className="h-[24rem] w-full overflow-hidden rounded-xl border"
    />
  )
}
