import { useState } from 'react'

import { FormWizardControlled } from './wizard-controlled.js'

export default function FormWizardControlledPreview() {
  const [step, setStep] = useState(0)
  return (
    <FormWizardControlled
      step={step}
      steps={[
        { id: 'details', title: 'Details', content: <p>Describe the Domain.</p> },
        { id: 'review', title: 'Review', content: <p>Confirm the revision.</p> },
      ]}
      onStepChange={setStep}
      onSubmit={() => undefined}
    />
  )
}
