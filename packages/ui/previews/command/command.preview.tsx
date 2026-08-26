import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@astrale-os/ui/command'

export const preview = { source: '@shadcn/command' } as const

export default function CommandPreview() {
  return (
    <Command className="command-specimen">
      <CommandInput placeholder="Find a command…" />
      <CommandList>
        <CommandEmpty>No command found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>Open Domain</CommandItem>
          <CommandItem>Inspect Schema</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
