import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
export function OnboardingMultiStep({
  className,
  style,
  steps,
  current,
  canContinue,
  onCurrentChange,
  onComplete,
}: {
  className?: string
  style?: React.CSSProperties

  steps: readonly { id: string; title: string; content: React.ReactNode }[]
  current: number
  canContinue: boolean
  onCurrentChange(step: number): void
  onComplete(): void
}) {
  const step = steps[current]
  return (
    <main
      data-slot="block-onboarding-multi-step"
      style={style}
      className={cn('mx-auto max-w-2xl', className)}
    >
      <ol data-slot="blocks-onboarding-multi-step-ol" className="flex gap-2 border-b py-4">
        {steps.map((item, index) => (
          <li
            data-slot="blocks-onboarding-multi-step-li"
            key={item.id}
            aria-current={index === current ? 'step' : undefined}
          >
            {index + 1}. {item.title}
          </li>
        ))}
      </ol>
      <section data-slot="blocks-onboarding-multi-step-section" className="py-8">
        <h1 data-slot="blocks-onboarding-multi-step-h1" className="font-heading text-3xl">
          {step?.title}
        </h1>
        {step?.content}
      </section>
      <footer data-slot="blocks-onboarding-multi-step-footer" className="flex gap-2">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => onCurrentChange(current - 1)}
        >
          Back
        </Button>
        <Button
          disabled={!canContinue}
          onClick={() =>
            current === steps.length - 1 ? onComplete() : onCurrentChange(current + 1)
          }
        >
          {current === steps.length - 1 ? 'Complete' : 'Continue'}
        </Button>
      </footer>
    </main>
  )
}
