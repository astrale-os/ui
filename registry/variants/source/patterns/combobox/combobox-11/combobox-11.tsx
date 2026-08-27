import { useId, useState } from 'react'

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor
} from '@/components/ui/combobox'
import { Label } from '@astrale-os/ui/label'

const frameworks = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro', 'React', 'Vue', 'Angular', 'SolidJS', 'Qwik']

const MAX_VISIBLE = 2

const ComboboxMultipleExpandableDemo = () => {
  const id = useId()
  const anchor = useComboboxAnchor()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Multiple combobox expandable</Label>

      <Combobox
        multiple
        autoHighlight
        id={id}
        items={frameworks}
        defaultValue={[frameworks[0], frameworks[1], frameworks[2], frameworks[3], frameworks[4]]}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(values: string[]) => {
              const visibleValues = expanded ? values : values.slice(0, MAX_VISIBLE)
              const hiddenCount = values.length - MAX_VISIBLE

              return (
                <>
                  {visibleValues.map((value: string) => (
                    <ComboboxChip key={value}>{value}</ComboboxChip>
                  ))}
                  {values.length > MAX_VISIBLE && (
                    <ComboboxChip
                      key='toggle'
                      showRemove={false}
                      className='cursor-pointer'
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        setExpanded(prev => !prev)
                      }}
                    >
                      {expanded ? 'Show Less' : `+${hiddenCount} more`}
                    </ComboboxChip>
                  )}
                  <ComboboxChipsInput />
                </>
              )
            }}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export default ComboboxMultipleExpandableDemo
