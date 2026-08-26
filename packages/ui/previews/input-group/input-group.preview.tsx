import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@astrale-os/ui/input-group'

export const preview = { source: '@shadcn/input-group' } as const

export default function InputGroupPreview() {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>astrale://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput aria-label="Graph path" defaultValue="domains/observatory" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Copy</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
