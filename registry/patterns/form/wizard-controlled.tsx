import { Button } from '@astrale-os/ui/button'
export function FormWizardControlled({
  className,
  style,
  step,
  steps,
  canContinue = true,
  onStepChange,
  onSubmit,
}: {
  className?: string
  style?: React.CSSProperties

  step: number
  steps: readonly { id: string; title: string; content: React.ReactNode }[]
  canContinue?: boolean
  onStepChange(step: number): void
  onSubmit(): void
}) {
  const current = steps[step]
  return (
    <form
      data-slot="pattern-form-wizard-controlled"
      className={className}
      style={style}
      onSubmit={(event) => {
        event.preventDefault()
        if (step === steps.length - 1) onSubmit()
        else onStepChange(step + 1)
      }}
    >
      <ol
        data-slot="patterns-form-wizard-controlled-ol"
        aria-label="Progress"
        className="flex gap-2"
      >
        {steps.map((item, index) => (
          <li
            data-slot="patterns-form-wizard-controlled-li"
            key={item.id}
            aria-current={index === step ? 'step' : undefined}
          >
            {index + 1}. {item.title}
          </li>
        ))}
      </ol>
      <section
        data-slot="patterns-form-wizard-controlled-section"
        aria-labelledby={`step-${current?.id}`}
      >
        <h2 data-slot="patterns-form-wizard-controlled-h2" id={`step-${current?.id}`}>
          {current?.title}
        </h2>
        {current?.content}
      </section>
      <div data-slot="patterns-form-wizard-controlled-div" className="flex gap-2">
        <Button type="button" disabled={step === 0} onClick={() => onStepChange(step - 1)}>
          Back
        </Button>
        <Button type="submit" disabled={!canContinue}>
          {step === steps.length - 1 ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </form>
  )
}
