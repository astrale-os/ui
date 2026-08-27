import { useId } from 'react'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@/components/ui/combobox'
import { Label } from '@astrale-os/ui/label'

const frameworks = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'] as const

const ComboboxSlideInDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Combobox menu slide-in from bottom</Label>
      <Combobox id={id} items={frameworks}>
        <ComboboxInput placeholder='Select a framework' />
        <ComboboxContent className='data-open:zoom-in-100 data-[side=bottom]:slide-in-from-bottom-10! duration-400'>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {item => (
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

export default ComboboxSlideInDemo
