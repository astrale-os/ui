import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@astrale-os/ui/select'
import { useState } from 'react'

const items = [
  { label: 'Production', value: 'production' },
  { label: 'Staging', value: 'staging' },
]

export const preview = { source: '@shadcn/select' } as const

export default function SelectPreview() {
  const [value, setValue] = useState('production')
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) setValue(next)
      }}
    >
      <SelectTrigger aria-label="Environment">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
