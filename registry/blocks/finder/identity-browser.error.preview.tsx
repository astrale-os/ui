import { IdentityBrowser } from './identity-browser.js'
import { failingIdentitySource } from './identity.fixture.js'

export default function IdentityBrowserErrorPreview() {
  return (
    <IdentityBrowser
      source={failingIdentitySource}
      onConfirm={() => undefined}
      onCancel={() => undefined}
      className="h-[20rem] w-full max-w-[34rem] overflow-hidden rounded-xl border"
    />
  )
}
