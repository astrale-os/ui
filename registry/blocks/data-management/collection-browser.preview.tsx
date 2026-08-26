import { useState } from 'react'

import { CollectionBrowser } from './collection-browser.js'
import { records } from './data-management.fixture.js'

export default function CollectionBrowserPreview() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('observatory')
  return (
    <CollectionBrowser
      rows={records.filter((record) => record.title.toLowerCase().includes(query.toLowerCase()))}
      query={query}
      selected={selected}
      onQueryChange={setQuery}
      onSelect={setSelected}
      onCreate={() => undefined}
    />
  )
}
