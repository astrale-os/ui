import { useState } from 'react'

import { DatePickerSingle } from './single.js'

export default function DatePickerSinglePreview() {
  const [value, setValue] = useState('2026-09-08')
  return <DatePickerSingle value={value} onValueChange={setValue} />
}
