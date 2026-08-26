import { Toaster } from './sonner.js'

export const preview = { canvas: 'compact', source: '@shadcn/sonner' } as const

export default function SonnerPreview() {
  return (
    <>
      <Toaster />
      <span>Sonner host mounted</span>
    </>
  )
}
