import { useState } from 'react'

import { QuestionnaireMultiStep } from './multi-step.js'

export default function QuestionnaireMultiStepPreview() {
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState('')
  return (
    <QuestionnaireMultiStep
      questions={[
        { id: 'goal', label: 'What should the Domain own?' },
        { id: 'proof', label: 'How will it be qualified?' },
      ]}
      step={step}
      answer={answer}
      onAnswer={setAnswer}
      onStepChange={(next) => {
        setStep(next)
        setAnswer('')
      }}
      onComplete={() => undefined}
    />
  )
}
