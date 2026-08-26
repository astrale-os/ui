import { useState } from 'react'

import { environmentOptions } from './combobox.fixture.js'
import { ComboboxMultiple } from './multiple.js'

export default function ComboboxMultiplePreview() {
  const [query, setQuery] = useState('')
  const [values, setValues] = useState<readonly string[]>(['production'])
  return (
    <ComboboxMultiple
      options={environmentOptions}
      query={query}
      values={values}
      onQueryChange={setQuery}
      onValuesChange={setValues}
    />
  )
}
