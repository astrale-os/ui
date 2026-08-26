import { useState } from 'react'

import { QuestionnaireSinglePage } from './single-page.js'

export default function QuestionnaireSinglePagePreview() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  return (
    <QuestionnaireSinglePage
      questions={[
        { id: 'goal', label: 'Goal', required: true },
        { id: 'proof', label: 'Qualification proof' },
      ]}
      answers={answers}
      onAnswer={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))}
      onSubmit={() => undefined}
    />
  )
}
