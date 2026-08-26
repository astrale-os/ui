import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from './combobox.js'

const items = [
  { label: 'Production', value: 'production' },
  { label: 'Staging', value: 'staging' },
]

export const preview = { source: '@shadcn/combobox' } as const

export default function ComboboxPreview() {
  return (
    <Combobox items={items} defaultValue={items[0]}>
      <ComboboxInput
        aria-label="Choose environment"
        placeholder="Choose environment"
        showTrigger={false}
      />
      <ComboboxContent>
        <ComboboxEmpty>No environment found.</ComboboxEmpty>
        <ComboboxList>
          {items.map((item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
