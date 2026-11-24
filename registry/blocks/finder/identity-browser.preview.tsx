import { IdentityBrowser } from './identity-browser.js'
import { identitySource, SELF } from './identity.fixture.js'

export default function IdentityBrowserPreview() {
  return (
    <IdentityBrowser
      source={identitySource}
      self={SELF}
      maximum={5}
      title="Add members"
      description="Issues asks for the people and groups to add to Product."
      unavailable={new Map([['u-1', 'Already a member']])}
      onConfirm={() => undefined}
      onCancel={() => undefined}
      className="h-[34rem] w-full max-w-[34rem] overflow-hidden rounded-xl border"
    />
  )
}
