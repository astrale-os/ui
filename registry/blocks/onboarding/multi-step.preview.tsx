import { useState } from 'react'

import { OnboardingMultiStep } from './multi-step.js'

export default function OnboardingMultiStepPreview() {
  const [current, setCurrent] = useState(0)
  return (
    <OnboardingMultiStep
      steps={[
        { id: 'welcome', title: 'Welcome', content: <p>Start with the UI catalog.</p> },
        { id: 'theme', title: 'Theme', content: <p>Choose a portable theme.</p> },
      ]}
      current={current}
      canContinue
      onCurrentChange={setCurrent}
      onComplete={() => undefined}
    />
  )
}
