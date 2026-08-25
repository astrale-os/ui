import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'

import { Button } from './action/button/index.js'
import { cn } from './class-name.js'
import { Table } from './content/table/index.js'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './disclosure/accordion/index.js'
import { createToastManager, Toaster } from './feedback/toast/index.js'
import { Checkbox } from './input/checkbox/index.js'
import { Input } from './input/input/index.js'
import { NativeSelect } from './input/native-select/index.js'
import { Select, SelectTrigger, SelectValue } from './input/select/index.js'
import { Switch } from './input/switch/index.js'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './menu/command/index.js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './navigation/tabs/index.js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './overlay/dialog/index.js'

afterEach(cleanup)

describe('runtime owners', () => {
  test('merges consumer classes without retaining conflicting Tailwind utilities', () => {
    expect(cn('px-2 text-sm', false, 'px-4')).toBe('text-sm px-4')
  })

  test('button preserves native behavior and supports an explicit child owner', async () => {
    const user = userEvent.setup()
    let activations = 0
    render(
      <Button render={<a href="#destination" />} onClick={() => activations++}>
        Continue
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Continue' })
    expect(link).toHaveAttribute('data-slot', 'button')
    await user.click(link)
    expect(activations).toBe(1)
  })

  test('input keeps native labeling, invalid, disabled, and value semantics', () => {
    render(
      <label>
        Workspace
        <Input aria-invalid disabled value="Astrale" readOnly />
      </label>,
    )
    const input = screen.getByRole('textbox', { name: 'Workspace' })
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveValue('Astrale')
  })

  test('checkbox exposes its checked state and changes through keyboard activation', async () => {
    const user = userEvent.setup()
    render(<Checkbox aria-label="Select row" />)
    const checkbox = screen.getByRole('checkbox', { name: 'Select row' })
    checkbox.focus()
    await user.keyboard(' ')
    expect(checkbox).toBeChecked()
  })

  test('representative convenience wrappers expose their internally emitted visual parts', () => {
    const { container } = render(
      <>
        <Switch
          aria-label="Notifications"
          thumbProps={{ className: 'host-thumb', style: { opacity: 0.75 } }}
        />
        <Table containerProps={{ className: 'host-table-container', style: { maxWidth: 320 } }}>
          <tbody>
            <tr>
              <td>Value</td>
            </tr>
          </tbody>
        </Table>
        <Select defaultValue="one">
          <SelectTrigger icon={<span data-testid="host-select-icon">Custom</span>}>
            <SelectValue />
          </SelectTrigger>
        </Select>
        <NativeSelect
          aria-label="Environment"
          className="host-native-select"
          wrapperProps={{ className: 'host-native-wrapper' }}
          icon={<span data-testid="host-native-icon">Open</span>}
        >
          <option value="production">Production</option>
        </NativeSelect>
      </>,
    )

    const thumb = container.querySelector('[data-slot="switch-thumb"]')
    expect(thumb).toHaveClass('host-thumb')
    expect(thumb).toHaveStyle({ opacity: '0.75' })
    const tableContainer = container.querySelector('[data-slot="table-container"]')
    expect(tableContainer).toHaveClass('host-table-container')
    expect(tableContainer).toHaveStyle({ maxWidth: '320px' })
    expect(screen.getByTestId('host-select-icon')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Environment' })).toHaveClass('host-native-select')
    expect(container.querySelector('[data-slot="native-select-wrapper"]')).toHaveClass(
      'host-native-wrapper',
    )
    expect(screen.getByTestId('host-native-icon')).toBeInTheDocument()
  })

  test('accordion and tabs preserve composite keyboard contracts', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Accordion>
          <AccordionItem value="details">
            <AccordionTrigger collapsedIconProps={{ className: 'host-collapsed-icon' }}>
              Details
            </AccordionTrigger>
            <AccordionContent>Visible details</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Tabs defaultValue="one">
          <TabsList aria-label="Sections">
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First panel</TabsContent>
          <TabsContent value="two">Second panel</TabsContent>
        </Tabs>
      </>,
    )

    await user.click(screen.getByRole('button', { name: 'Details' }))
    expect(screen.getByText('Visible details')).toBeVisible()
    expect(document.querySelector('[data-slot="accordion-trigger-icon"]')).toHaveClass(
      'host-collapsed-icon',
    )

    const firstTab = screen.getByRole('tab', { name: 'One' })
    firstTab.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second panel')
  })

  test('command filtering and keyboard activation are owned by Base UI', async () => {
    const user = userEvent.setup()
    let selected = ''
    render(
      <Command>
        <CommandInput aria-label="Find command" />
        <CommandList>
          <CommandEmpty>No command found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem value="Dashboard" onSelect={(value) => (selected = value)}>
              Dashboard
            </CommandItem>
            <CommandItem value="Settings" onSelect={(value) => (selected = value)}>
              Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    )

    const input = screen.getByRole('combobox', { name: 'Find command' })
    await user.type(input, 'sett')
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeVisible()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(selected).toBe('Settings')
  })

  test('dialog labels its modal, dismisses with Escape, and restores trigger focus', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger render={<Button />}>Open settings</DialogTrigger>
        <DialogContent
          closeIcon={<span data-testid="host-close-icon">×</span>}
          closeLabel="Dismiss settings"
        >
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure the workspace.</DialogDescription>
          <Button>Save</Button>
        </DialogContent>
      </Dialog>,
    )

    const trigger = screen.getByRole('button', { name: 'Open settings' })
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Settings' })).toHaveAccessibleDescription(
      'Configure the workspace.',
    )
    expect(screen.getByRole('button', { name: 'Dismiss settings' })).toContainElement(
      screen.getByTestId('host-close-icon'),
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  test('toast convenience methods retain Base live-region behavior and open viewport placement', async () => {
    const manager = createToastManager()
    render(<Toaster toastManager={manager} position="top-center" />)

    manager.error('Unable to save', { description: 'Try the operation again.' })

    const toastRoot = await waitFor(() => {
      const root = document.querySelector<HTMLElement>('[data-slot="toast"]')
      expect(root).not.toBeNull()
      return root!
    })
    expect(within(toastRoot).getByText('Unable to save')).toBeVisible()
    expect(within(toastRoot).getByText('Try the operation again.')).toBeVisible()
    expect(document.querySelector('[data-slot="toast-viewport"]')).toHaveAttribute(
      'data-position',
      'top-center',
    )
  })
})
