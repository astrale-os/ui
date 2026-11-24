import type { IdentityChoice } from '@astrale-os/ui/identity-finder'

import { cn } from '@astrale-os/ui/class-name'
import { Dialog, DialogContent } from '@astrale-os/ui/dialog'
import { useId } from 'react'

import { IdentityBrowser, type IdentityBrowserProps } from './identity-browser.js'

export interface IdentitySelectorProps extends Omit<
  IdentityBrowserProps,
  'titleId' | 'descriptionId' | 'onConfirm' | 'onCancel'
> {
  /** The dialog shows while a request is open. */
  open: boolean
  onConfirm(choices: readonly IdentityChoice[]): void | Promise<void>
  /** Cancel, Escape, or a click outside. */
  onCancel(): void
  className?: string
  style?: React.CSSProperties
}

/**
 * The identity finder in a dialog: what a host shows when a View asks the user to select people,
 * groups or Roles.
 */
export function IdentitySelector({
  open,
  onConfirm,
  onCancel,
  className,
  style,
  ...browser
}: IdentitySelectorProps) {
  const titleId = useId()
  const descriptionId = useId()
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        // The finder owns Escape: it clears the search, leaves an opened group, then cancels.
        if (!next && details.reason !== 'escape-key') onCancel()
      }}
    >
      <DialogContent
        data-slot="block-finder-identity-selector"
        aria-labelledby={titleId}
        aria-describedby={browser.description ? descriptionId : undefined}
        showCloseButton={false}
        className={cn(
          'h-[min(36rem,calc(100dvh-2rem))] grid-cols-1 gap-0 overflow-hidden p-0 sm:max-w-[min(34rem,calc(100%-2rem))]',
          className,
        )}
        style={style}
      >
        <IdentityBrowser
          {...browser}
          titleId={titleId}
          descriptionId={descriptionId}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
