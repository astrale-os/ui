import { useState } from 'react'

import { conversations } from './communication.fixture.js'
import { InboxBlock } from './inbox.js'

export default function InboxBlockPreview() {
  const [selected, setSelected] = useState('runtime')
  return (
    <InboxBlock
      conversations={conversations}
      selected={selected}
      onSelect={setSelected}
      onLoadMore={() => undefined}
    />
  )
}
