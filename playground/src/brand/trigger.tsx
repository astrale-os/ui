import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@astrale-os/ui'
import { ImageIcon } from 'lucide-react'
import { lazy, Suspense } from 'react'

// The generator loads with the sheet, so the catalog's first paint does not carry the logo geometry.
const BrandStudio = lazy(() =>
  import('./studio.js').then((module) => ({ default: module.BrandStudio })),
)

export function BrandAssets() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <ImageIcon data-icon="inline-start" />
        Logo
      </SheetTrigger>
      <SheetContent side="right" className="brand-studio-sheet">
        <SheetHeader>
          <SheetTitle>Astrale logo</SheetTitle>
          <SheetDescription>Generate the logo as SVG or PNG, in the brand colors.</SheetDescription>
        </SheetHeader>
        <Suspense fallback={null}>
          <BrandStudio />
        </Suspense>
      </SheetContent>
    </Sheet>
  )
}
