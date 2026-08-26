import { Checkbox } from '@astrale-os/ui/checkbox'
import { Input } from '@astrale-os/ui/input'
export function ComboboxMultiple({
  className,
  style,
  options,
  query,
  values,
  onQueryChange,
  onValuesChange,
}: {
  className?: string
  style?: React.CSSProperties

  options: readonly { id: string; label: string }[]
  query: string
  values: readonly string[]
  onQueryChange(value: string): void
  onValuesChange(values: readonly string[]): void
}) {
  const toggle = (id: string) =>
    onValuesChange(values.includes(id) ? values.filter((value) => value !== id) : [...values, id])
  return (
    <fieldset data-slot="pattern-combobox-multiple" style={style} className={className}>
      <legend data-slot="patterns-combobox-multiple-legend">Choose options</legend>
      <Input
        aria-label="Filter options"
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
      />
      {options
        .filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
        .map((option) => (
          <label
            data-slot="patterns-combobox-multiple-label"
            key={option.id}
            className="flex items-center gap-2"
          >
            <Checkbox
              checked={values.includes(option.id)}
              onCheckedChange={() => toggle(option.id)}
            />
            {option.label}
          </label>
        ))}
    </fieldset>
  )
}
