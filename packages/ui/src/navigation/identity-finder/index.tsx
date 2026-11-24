'use client'

import * as React from 'react'

import type { IdentityImage } from './source.js'

import { initialsOf } from '../finder/format.js'
import {
  useIdentityFinderController,
  type IdentityFinderController,
  type IdentityFinderOptions,
  type IdentityRow,
} from './controller.js'

/*
  The identity finder: search people, groups, Roles and every other kind of Identity a source
  lists, open a group or a Role to walk its members, and choose up to a maximum. Headless: the
  parts carry behavior, ARIA and `data-*` state, never a look; the registry blocks
  `block/finder/identity-browser` and `block/finder/identity-selector` give the default one.

  The input is a combobox over one listbox: the focus stays in the input while the arrows walk the
  rows, Enter chooses, → opens a group, ← or Backspace goes back out, and Escape clears the text,
  then leaves what is open, then cancels.
*/

const IdentityFinderContext = React.createContext<IdentityFinderController | null>(null)

/** The identity finder's state and actions, for parts a host composes itself. */
function useIdentityFinder(): IdentityFinderController {
  const finder = React.useContext(IdentityFinderContext)
  if (!finder) throw new Error('Identity finder parts must be rendered inside <IdentityFinder>.')
  return finder
}

function IdentityFinder({
  source,
  accepts,
  maximum,
  unavailable,
  self,
  onConfirm,
  onCancel,
  theme,
  pageSize,
  sectionSize,
  searchDelay,
  onKeyDown,
  children,
  ...props
}: IdentityFinderOptions & Omit<React.ComponentProps<'div'>, keyof IdentityFinderOptions>) {
  const finder = useIdentityFinderController({
    source,
    ...(accepts ? { accepts } : {}),
    ...(maximum === undefined ? {} : { maximum }),
    ...(unavailable ? { unavailable } : {}),
    ...(self === undefined ? {} : { self }),
    onConfirm,
    onCancel,
    ...(theme ? { theme } : {}),
    ...(pageSize === undefined ? {} : { pageSize }),
    ...(sectionSize === undefined ? {} : { sectionSize }),
    ...(searchDelay === undefined ? {} : { searchDelay }),
  })
  return (
    <IdentityFinderContext.Provider value={finder}>
      <div
        data-slot="identity-finder"
        data-view={finder.view}
        data-searching={finder.searching ? '' : undefined}
        data-maximum-reached={finder.maximumReached ? '' : undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          // A menu a host opens from inside is portaled out: Escape there closes the menu only.
          const inside = event.target instanceof Node && event.currentTarget.contains(event.target)
          if (!event.defaultPrevented && inside) finder.onRootKeyDown(event)
        }}
        {...props}
      >
        {children}
      </div>
    </IdentityFinderContext.Provider>
  )
}

/** The search field: a combobox that walks the rows while it keeps the focus. */
function IdentityFinderInput(props: React.ComponentProps<'input'>) {
  const finder = useIdentityFinder()
  return <input data-slot="identity-finder-input" {...finder.getInputProps(props)} />
}

/** The listbox every row renders in. */
function IdentityFinderList(props: React.ComponentProps<'div'>) {
  const finder = useIdentityFinder()
  return <div data-slot="identity-finder-list" {...finder.getListboxProps(props)} />
}

/** One row: an Identity to choose, or a kind to open. */
function IdentityFinderOption({
  row,
  ...props
}: { row: IdentityRow } & React.ComponentProps<'div'>) {
  const finder = useIdentityFinder()
  return (
    <div
      data-slot="identity-finder-option"
      data-type={row.type}
      {...finder.getOptionProps(row, props)}
    />
  )
}

/**
 * An Identity's picture, or its name's initials: never inlined, so a picture cannot run script or
 * restyle the page.
 */
function IdentityAvatar({
  name,
  image,
  theme: themeProp,
  ...props
}: Omit<React.ComponentProps<'span'>, 'children'> & {
  name?: string
  image?: IdentityImage
  theme?: 'light' | 'dark'
}) {
  const finderTheme = React.useContext(IdentityFinderContext)?.theme
  const theme = themeProp ?? finderTheme
  if (image === undefined) {
    return (
      <span data-slot="identity-avatar" data-fallback="" aria-hidden="true" {...props}>
        {name === undefined ? '?' : initialsOf(name)}
      </span>
    )
  }
  return (
    <span data-slot="identity-avatar" aria-hidden="true" {...props}>
      {theme !== undefined || image.dark === undefined ? (
        <img
          data-slot="identity-avatar-image"
          src={theme === 'dark' && image.dark ? image.dark : image.src}
          alt=""
          draggable={false}
        />
      ) : (
        <picture>
          <source srcSet={image.dark} media="(prefers-color-scheme: dark)" />
          <img data-slot="identity-avatar-image" src={image.src} alt="" draggable={false} />
        </picture>
      )}
    </span>
  )
}

/** Confirms the chosen Identities; disabled while none is chosen or a confirmation runs. */
function IdentityFinderConfirm({ onClick, disabled, ...props }: React.ComponentProps<'button'>) {
  const finder = useIdentityFinder()
  return (
    <button
      type="button"
      data-slot="identity-finder-confirm"
      disabled={disabled || finder.chosen.length === 0 || finder.confirming}
      aria-busy={finder.confirming || undefined}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) finder.confirm()
      }}
      {...props}
    />
  )
}

function IdentityFinderCancel({ onClick, ...props }: React.ComponentProps<'button'>) {
  const finder = useIdentityFinder()
  return (
    <button
      type="button"
      data-slot="identity-finder-cancel"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) finder.cancel()
      }}
      {...props}
    />
  )
}

export {
  IdentityAvatar,
  IdentityFinder,
  IdentityFinderCancel,
  IdentityFinderConfirm,
  IdentityFinderInput,
  IdentityFinderList,
  IdentityFinderOption,
  useIdentityFinder,
  useIdentityFinderController,
}
export type {
  Identity,
  IdentityChoice,
  IdentityFinderSource,
  IdentityImage,
  IdentityKind,
  IdentityPage,
  IdentitySearch,
} from './source.js'
export type {
  IdentityFinderController,
  IdentityFinderOptions,
  IdentityList,
  IdentityReadStatus,
  IdentityRow,
  IdentitySection,
} from './controller.js'
export { createMemoryIdentitySource } from './memory.js'
export type { IdentityMemoryDirectory, IdentityMemoryEntry, IdentityMemoryKind } from './memory.js'
export { initialsOf } from '../finder/format.js'
