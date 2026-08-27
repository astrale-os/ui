import { useState } from 'react'

import { ColorPicker } from './color-picker.js'

export default function ColorPickerPreview() {
  const [value, setValue] = useState('#2563eb')

  return (
    <ColorPicker
      label={value}
      value={value}
      onChange={(color) => setValue(color.toString('hex'))}
    />
  )
}

export const preview = {
  canvas: 'compact' as const,
  source: '@react-aria/tailwind-colorpicker',
}
