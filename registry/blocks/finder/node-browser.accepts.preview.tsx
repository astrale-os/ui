import { NAMED, finderSource } from './finder.fixture.js'
import { NodeBrowser } from './node-browser.js'

export const preview = { canvas: 'wide' } as const

export default function NodeBrowserAcceptsPreview() {
  return (
    <NodeBrowser
      source={finderSource}
      accepts={[NAMED]}
      maximum={8}
      onConfirm={() => undefined}
      onCancel={() => undefined}
      className="h-[36rem] w-full overflow-hidden rounded-xl border"
    />
  )
}
