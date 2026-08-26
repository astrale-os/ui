import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireItem,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from './questionnaire.js'

const items = [
  {
    choices: [{ value: 'inspect' }, { value: 'implement' }],
    name: 'next',
    required: true,
  },
] as const

export const preview = { source: '@shadcn/questionnaire' } as const

export default function QuestionnairePreview() {
  return (
    <Questionnaire defaultItem="next" items={items} onSubmit={() => undefined}>
      <QuestionnaireProgress />
      <QuestionnaireItem name="next" required>
        <QuestionnaireTitle>What should happen next?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="inspect">Inspect</QuestionnaireChoice>
          <QuestionnaireChoice value="implement">Implement</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnaireSubmit>Continue</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  )
}
