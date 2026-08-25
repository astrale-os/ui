import { Button } from '@astrale-os/ui/button'
import { Input } from '@astrale-os/ui/input'
export function QuestionnaireSinglePage({
  className,
  style,
  questions,
  answers,
  errors,
  onAnswer,
  onSubmit,
}: {
  className?: string
  style?: React.CSSProperties

  questions: readonly { id: string; label: string; required?: boolean }[]
  answers: Readonly<Record<string, string>>
  errors?: Readonly<Record<string, string>>
  onAnswer(id: string, value: string): void
  onSubmit(): void
}) {
  return (
    <form
      data-slot="pattern-questionnaire-single-page"
      className={className}
      style={style}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      {questions.map((question) => {
        const errorId = `${question.id}-error`
        return (
          <label
            data-slot="patterns-questionnaire-single-page-label"
            key={question.id}
            className="grid gap-1"
          >
            {question.label}
            <Input
              required={question.required}
              value={answers[question.id] ?? ''}
              aria-invalid={Boolean(errors?.[question.id])}
              aria-describedby={errors?.[question.id] ? errorId : undefined}
              onChange={(event) => onAnswer(question.id, event.currentTarget.value)}
            />
            {errors?.[question.id] && (
              <span data-slot="patterns-questionnaire-single-page-span" id={errorId} role="alert">
                {errors[question.id]}
              </span>
            )}
          </label>
        )
      })}
      <Button type="submit">Submit answers</Button>
    </form>
  )
}
