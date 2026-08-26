import { useState } from 'react'

import { environmentOptions } from './combobox.fixture.js'
import { ComboboxSingleBasic } from './single-basic.js'

export default function ComboboxSingleBasicPreview() {
  const [query, setQuery] = useState('')
  const [value, setValue] = useState<string>()
  return (
    <ComboboxSingleBasic
      options={environmentOptions}
      query={query}
      value={value}
      open
      onQueryChange={setQuery}
      onValueChange={setValue}
    />
  )
}
