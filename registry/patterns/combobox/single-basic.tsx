import { Input } from '@astrale-os/ui/input'
import { useId } from 'react'
export type ComboOption = { id: string; label: string }
export function ComboboxSingleBasic({
  className,
  style,
  options,
  query,
  value,
  open,
  onQueryChange,
  onValueChange,
}: {
  className?: string
  style?: React.CSSProperties

  options: readonly ComboOption[]
  query: string
  value?: string
  open: boolean
  onQueryChange(value: string): void
  onValueChange(value: string): void
}) {
  const listboxId = useId()
  const visible = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div data-slot="pattern-combobox-single-basic" style={style} className={className}>
      <Input
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
      />
      {open && (
        <ul data-slot="patterns-combobox-single-basic-ul" id={listboxId} role="listbox">
          {visible.map((option) => (
            <li
              data-slot="patterns-combobox-single-basic-li"
              key={option.id}
              role="option"
              aria-selected={option.id === value}
              tabIndex={0}
              onClick={() => onValueChange(option.id)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
