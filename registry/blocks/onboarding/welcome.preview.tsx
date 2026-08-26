import { OnboardingWelcome } from './welcome.js'

export default function OnboardingWelcomePreview() {
  return (
    <OnboardingWelcome
      name="Astrale UI"
      description="Owned components, patterns, blocks, and portable themes."
      onBegin={() => undefined}
      onSkip={() => undefined}
    />
  )
}
