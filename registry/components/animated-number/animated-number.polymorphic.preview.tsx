'use client'
import { Button } from '@astrale-os/ui/button'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'

import { AnimatedNumber } from './animated-number.js'

export const preview = { canvas: 'compact', source: '@motion-primitives/animated-number' } as const

export default function AnimatedNumberPolymorphicPreview() {
  const [value, setValue] = useState(1000)

  return (
    <div className="inline-cluster">
      <Button
        aria-label="Decrement"
        size="icon"
        variant="outline"
        onClick={() => setValue((prev) => prev - 100)}
      >
        <Minus />
      </Button>
      <AnimatedNumber
        as="strong"
        className="inline-flex items-center font-mono text-2xl font-light"
        springOptions={{
          bounce: 0,
          duration: 1000,
        }}
        value={value}
      />
      <Button
        aria-label="Increment"
        size="icon"
        variant="outline"
        onClick={() => setValue((prev) => prev + 100)}
      >
        <Plus />
      </Button>
    </div>
  )
}
