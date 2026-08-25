import { Button } from '@astrale-os/ui/button'
import { Input } from '@astrale-os/ui/input'
export function QuestionnaireMultiStep({
  className,
  style,
  questions,
  step,
  answer,
  onAnswer,
  onStepChange,
  onComplete,
}: {
  className?: string
  style?: React.CSSProperties

  questions: readonly { id: string; label: string }[]
  step: number
  answer: string
  onAnswer(value: string): void
  onStepChange(step: number): void
  onComplete(): void
}) {
  const question = questions[step]
  return (
    <section
      data-slot="pattern-questionnaire-multi-step"
      style={style}
      aria-live="polite"
      className={className}
    >
      <p data-slot="patterns-questionnaire-multi-step-p">
        Question {step + 1} of {questions.length}
      </p>
      <label data-slot="patterns-questionnaire-multi-step-label">
        {question?.label}
        <Input value={answer} onChange={(event) => onAnswer(event.currentTarget.value)} />
      </label>
      <div data-slot="patterns-questionnaire-multi-step-div" className="flex gap-2">
        <Button disabled={step === 0} onClick={() => onStepChange(step - 1)}>
          Back
        </Button>
        <Button
          disabled={!answer}
          onClick={() => (step === questions.length - 1 ? onComplete() : onStepChange(step + 1))}
        >
          {step === questions.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </div>
    </section>
  )
}
