import { useState } from 'react'

import { NativeForm } from './native.js'

export default function NativeFormPreview() {
  const [value, setValue] = useState('Observatory')
  return <NativeForm value={value} onValueChange={setValue} onSubmit={() => undefined} />
}
