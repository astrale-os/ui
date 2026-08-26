'use client'

import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete'
import * as React from 'react'

import { cn } from '#ui/class-name'
import { SearchIcon } from '#ui/icon'
import { InputGroup, InputGroupAddon } from '#ui/input/input-group'

type CommandProps = Omit<React.ComponentProps<'div'>, 'defaultValue'> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  shouldFilter?: boolean
  filter?: (value: string, search: string) => boolean
  label?: string
}

type CommandContextValue = {
  query: string
  shouldFilter: boolean
  filter?: (value: string, search: string) => boolean
}

const CommandContext = React.createContext<CommandContextValue>({
  query: '',
  shouldFilter: true,
})

function Command({
  className,
  value,
  defaultValue,
  onValueChange,
  shouldFilter = true,
  filter,
  label = 'Commands',
  children,
  ...props
}: CommandProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '')
  const query = value ?? internalValue

  return (
    <AutocompletePrimitive.Root
      inline
      open
      autoHighlight
      mode="none"
      value={query}
      onValueChange={(nextValue) => {
        setInternalValue(nextValue)
        onValueChange?.(nextValue)
      }}
    >
      <CommandContext.Provider value={{ query, shouldFilter, filter }}>
        <div
          data-slot="command"
          aria-label={label}
          className={cn(
            'flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </CommandContext.Provider>
    </AutocompletePrimitive.Root>
  )
}

type CommandInputProps = Omit<AutocompletePrimitive.Input.Props, 'onChange'> & {
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onValueChange?: (value: string) => void
  icon?: React.ReactNode
  iconProps?: React.ComponentProps<'span'>
  wrapperProps?: React.ComponentProps<'div'>
}

function CommandInput({
  className,
  onChange,
  onValueChange,
  icon = <SearchIcon className="size-4 shrink-0 opacity-50" />,
  iconProps,
  wrapperProps,
  ...props
}: CommandInputProps) {
  return (
    <div
      data-slot="command-input-wrapper"
      {...wrapperProps}
      className={cn('p-1 pb-0', wrapperProps?.className)}
    >
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <AutocompletePrimitive.Input
          data-slot="command-input"
          className={cn(
            'w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          onChange={(event) => {
            onChange?.(event)
            onValueChange?.(event.currentTarget.value)
          }}
          {...props}
        />
        <InputGroupAddon>
          <span data-slot="command-input-icon" {...iconProps}>
            {icon}
          </span>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({ className, ...props }: AutocompletePrimitive.List.Props) {
  return (
    <AutocompletePrimitive.List
      data-slot="command-list"
      className={cn(
        'no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none',
        className,
      )}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm', className)}
      {...props}
    />
  )
}

type CommandGroupProps = AutocompletePrimitive.Group.Props & {
  heading?: React.ReactNode
  headingProps?: AutocompletePrimitive.GroupLabel.Props
}

function CommandGroup({ className, heading, headingProps, children, ...props }: CommandGroupProps) {
  return (
    <AutocompletePrimitive.Group
      data-slot="command-group"
      className={cn('overflow-hidden p-1 text-foreground', className)}
      {...props}
    >
      {heading === undefined ? null : (
        <AutocompletePrimitive.GroupLabel
          data-slot="command-group-heading"
          {...headingProps}
          className={cn(
            'px-2 py-1.5 text-xs font-medium text-muted-foreground',
            headingProps?.className,
          )}
        >
          {heading}
        </AutocompletePrimitive.GroupLabel>
      )}
      {children}
    </AutocompletePrimitive.Group>
  )
}

function CommandSeparator({ className, ...props }: AutocompletePrimitive.Separator.Props) {
  return (
    <AutocompletePrimitive.Separator
      data-slot="command-separator"
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  )
}

type CommandItemProps = Omit<AutocompletePrimitive.Item.Props, 'value'> & {
  value?: string
  onSelect?: (value: string) => void
}

function commandItemText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(commandItemText).join(' ')
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return commandItemText(node.props.children)
  }
  return ''
}

function CommandItem({
  className,
  children,
  value,
  onClick,
  onSelect,
  ...props
}: CommandItemProps) {
  const itemValue = value ?? commandItemText(children)
  const { query, shouldFilter, filter } = React.useContext(CommandContext)
  const matches = filter
    ? filter(itemValue, query)
    : itemValue.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())

  if (shouldFilter && query && !matches) return null

  return (
    <AutocompletePrimitive.Item
      data-slot="command-item"
      value={itemValue}
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) onSelect?.(itemValue)
      }}
      {...props}
    >
      {children}
    </AutocompletePrimitive.Item>
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground group-data-[highlighted]/command-item:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
export type { CommandProps, CommandInputProps, CommandGroupProps, CommandItemProps }
