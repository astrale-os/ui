import { Button } from '@astrale-os/ui/button'
import { cn } from '@astrale-os/ui/class-name'
export function OnboardingWelcome({
  className,
  style,
  name,
  description,
  onBegin,
  onSkip,
}: {
  className?: string
  style?: React.CSSProperties

  name: string
  description: string
  onBegin(): void
  onSkip?(): void
}) {
  return (
    <main
      data-slot="block-onboarding-welcome"
      style={style}
      className={cn('mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center', className)}
    >
      <p
        data-slot="blocks-onboarding-welcome-p"
        className="text-sm uppercase tracking-widest text-muted-foreground"
      >
        Welcome to
      </p>
      <h1 data-slot="blocks-onboarding-welcome-h1" className="font-heading text-5xl">
        {name}
      </h1>
      <p data-slot="blocks-onboarding-welcome-p" className="mt-4 text-lg text-muted-foreground">
        {description}
      </p>
      <div data-slot="blocks-onboarding-welcome-div" className="mt-8 flex gap-2">
        <Button onClick={onBegin}>Get started</Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
    </main>
  )
}
