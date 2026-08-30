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
import { InputGroup, InputGroupButton, InputGroupInput } from './input/input-group/index.js'
import { Input } from './input/input/index.js'
import { NativeSelect } from './input/native-select/index.js'
import { Select, SelectTrigger, SelectValue } from './input/select/index.js'
import { Slider } from './input/slider/index.js'
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

  test('button size tokens survive semantic trigger composition', () => {
    render(
      <>
        <Button size="sm">Small action</Button>
        <Dialog>
          <DialogTrigger render={<Button size="icon" />} aria-label="Open settings" />
        </Dialog>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Small action' })).toHaveAttribute('data-size', 'sm')
    expect(screen.getByRole('button', { name: 'Small action' })).toHaveClass(
      'h-(--ui-control-height-sm)',
    )
    const trigger = screen.getByRole('button', { name: 'Open settings' })
    expect(trigger).toHaveAttribute('data-slot', 'dialog-trigger')
    expect(trigger).toHaveAttribute('data-size', 'icon')
    expect(trigger).toHaveClass('size-(--ui-control-height)')
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
    expect(input).toHaveClass('h-(--ui-control-height)')
  })

  test('input groups keep tokenized control sizing with locally smaller actions', () => {
    const { container } = render(
      <InputGroup>
        <InputGroupInput aria-label="Graph path" />
        <InputGroupButton>Copy</InputGroupButton>
      </InputGroup>,
    )

    expect(container.querySelector('[data-slot="input-group"]')).toHaveClass(
      'h-(--ui-control-height)',
    )
    expect(screen.getByRole('textbox', { name: 'Graph path' })).toHaveAttribute(
      'data-slot',
      'input-group-control',
    )
    expect(screen.getByRole('textbox', { name: 'Graph path' })).toHaveClass(
      'h-(--ui-control-height)',
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute('data-size', 'xs')
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveClass('h-6')
  })

  test('slider keeps scalar controlled and uncontrolled state to one thumb', () => {
    const { container } = render(
      <>
        <Slider aria-label="Controlled density" value={[42]} />
        <Slider aria-label="Default density" defaultValue={[18]} />
      </>,
    )
    const inputs = [...container.querySelectorAll('input[type="range"]')]
    expect(inputs).toHaveLength(2)
    expect(inputs.map((input) => input.getAttribute('aria-valuenow'))).toEqual(['42', '18'])
  })

  test('checkbox exposes its checked state and changes through keyboard activation', async () => {
    const user = userEvent.setup()
    render(<Checkbox aria-label="Select row" />)
    const checkbox = screen.getByRole('checkbox', { name: 'Select row' })
    checkbox.focus()
    await user.keyboard(' ')
    expect(checkbox).toBeChecked()
  })

  test('public classes compose and emitted visual parts retain stable data slots', () => {
    const { container } = render(
      <>
        <Switch aria-label="Notifications" className="host-switch" />
        <Table className="host-table">
          <tbody>
            <tr>
              <td>Value</td>
            </tr>
          </tbody>
        </Table>
        <Select defaultValue="one">
          <SelectTrigger className="host-select-trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
        <NativeSelect aria-label="Environment" className="host-native-select">
          <option value="production">Production</option>
        </NativeSelect>
      </>,
    )

    expect(screen.getByRole('switch', { name: 'Notifications' })).toHaveClass('host-switch')
    expect(container.querySelector('[data-slot="switch-thumb"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="table-container"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="table"]')).toHaveClass('host-table')
    expect(container.querySelector('[data-slot="select-trigger"]')).toHaveAttribute(
      'data-size',
      'default',
    )
    expect(container.querySelector('[data-slot="select-trigger"]')).toHaveClass(
      'host-select-trigger',
      'data-[size=default]:h-(--ui-control-height)',
    )
    expect(container.querySelector('[data-slot="native-select-wrapper"]')).toHaveClass(
      'host-native-select',
    )
    expect(screen.getByRole('combobox', { name: 'Environment' })).toHaveAttribute(
      'data-slot',
      'native-select',
    )
    expect(screen.getByRole('combobox', { name: 'Environment' })).toHaveClass(
      'h-(--ui-control-height)',
    )
  })

  test('accordion and tabs preserve composite keyboard contracts', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Accordion>
          <AccordionItem value="details">
            <AccordionTrigger className="host-accordion-trigger">Details</AccordionTrigger>
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
    expect(screen.getByRole('button', { name: 'Details' })).toHaveClass('host-accordion-trigger')
    expect(document.querySelector('[data-slot="accordion-trigger-icon"]')).toBeInTheDocument()

    const firstTab = screen.getByRole('tab', { name: 'One' })
    firstTab.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second panel')
  })

  test('tabs own their root layout from the admitted orientation', () => {
    render(
      <>
        <Tabs data-testid="horizontal-tabs" />
        <Tabs data-testid="vertical-tabs" orientation="vertical" />
      </>,
    )

    expect(screen.getByTestId('horizontal-tabs')).toHaveAttribute('data-orientation', 'horizontal')
    expect(screen.getByTestId('horizontal-tabs')).toHaveClass('data-horizontal:flex-col')
    expect(screen.getByTestId('vertical-tabs')).toHaveAttribute('data-orientation', 'vertical')
    expect(screen.getByTestId('vertical-tabs')).toHaveClass('data-horizontal:flex-col')
  })

  test('command filtering and keyboard activation preserve the upstream cmdk contract', async () => {
    const user = userEvent.setup()
    let selected = ''
    const { container } = render(
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

    const input = container.querySelector<HTMLInputElement>('[data-slot="command-input"]')
    expect(input).not.toBeNull()
    await user.type(input!, 'sett')
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
        <DialogContent>
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
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  test('toast manager and rendered parts preserve the upstream Base UI contract', async () => {
    const manager = createToastManager()
    render(<Toaster toastManager={manager} />)

    manager.add({
      title: 'Unable to save',
      description: 'Try the operation again.',
      type: 'error',
    })

    const toastRoot = await waitFor(() => {
      const root = document.querySelector<HTMLElement>('[data-slot="toast"]')
      expect(root).not.toBeNull()
      return root!
    })
    expect(within(toastRoot).getByText('Unable to save')).toBeVisible()
    expect(within(toastRoot).getByText('Try the operation again.')).toBeVisible()
    expect(document.querySelector('[data-slot="toast-viewport"]')).toBeInTheDocument()
  })
})
