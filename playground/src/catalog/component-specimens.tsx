import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  AspectRatio,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  ButtonGroupText,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DirectionProvider,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Kbd,
  Label,
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NativeSelect,
  NativeSelectOption,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@astrale-os/ui'
import { useState } from 'react'

function Specimen({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <Card
      id={`component-${name}`}
      tabIndex={-1}
      size="sm"
      data-component={name}
      data-slot="component-specimen"
    >
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>@astrale-os/ui/{name}</CardDescription>
      </CardHeader>
      <CardContent className="specimen-content">{children}</CardContent>
    </Card>
  )
}

const selectItems = [
  { label: 'Production', value: 'production' },
  { label: 'Staging', value: 'staging' },
]

function ActionInputSpecimens() {
  const [switchValue, setSwitchValue] = useState(true)
  const [radio, setRadio] = useState('safe')
  return (
    <section id="actions-inputs" className="specimen-section" aria-labelledby="actions-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">01 · Runtime components</p>
          <h2 id="actions-title">Actions & inputs</h2>
        </div>
        <Badge variant="outline">16 owners</Badge>
      </div>
      <div className="specimen-grid">
        <Specimen name="button">
          <div className="inline-cluster">
            <Button>Continue</Button>
            <Button variant="secondary">Queue</Button>
            <Button variant="outline">Inspect</Button>
            <Button variant="destructive">Revoke</Button>
          </div>
        </Specimen>
        <Specimen name="button-group">
          <ButtonGroup>
            <Button variant="outline">Preview</Button>
            <ButtonGroupText>⌘ K</ButtonGroupText>
          </ButtonGroup>
        </Specimen>
        <Specimen name="toggle">
          <Toggle variant="outline" defaultPressed>
            Pin telemetry
          </Toggle>
        </Specimen>
        <Specimen name="toggle-group">
          <ToggleGroup defaultValue={['day']} variant="outline" spacing={0}>
            <ToggleGroupItem value="day">Day</ToggleGroupItem>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
          </ToggleGroup>
        </Specimen>
        <Specimen name="input">
          <Input aria-label="Domain path" value="/:observatory.astrale.ai" readOnly />
        </Specimen>
        <Specimen name="input-group">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>astrale://</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput aria-label="Graph path" value="domains/observatory" readOnly />
            <InputGroupAddon align="inline-end">
              <InputGroupButton>Copy</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Specimen>
        <Specimen name="textarea">
          <Textarea aria-label="Release note" defaultValue="Revision qualified and ready." />
        </Specimen>
        <Specimen name="checkbox">
          <Field orientation="horizontal">
            <Checkbox id="inherit-capabilities" defaultChecked />
            <FieldLabel htmlFor="inherit-capabilities">Include inherited capabilities</FieldLabel>
          </Field>
        </Specimen>
        <Specimen name="switch">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="stream-journal">Stream journal</FieldLabel>
            <Switch id="stream-journal" checked={switchValue} onCheckedChange={setSwitchValue} />
          </Field>
        </Specimen>
        <Specimen name="radio-group">
          <RadioGroup value={radio} onValueChange={setRadio} aria-label="Admission mode">
            <Field orientation="horizontal">
              <RadioGroupItem value="safe" id="radio-safe" />
              <FieldLabel htmlFor="radio-safe">Safe</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="direct" id="radio-direct" />
              <FieldLabel htmlFor="radio-direct">Direct</FieldLabel>
            </Field>
          </RadioGroup>
        </Specimen>
        <Specimen name="slider">
          <Field>
            <FieldLabel>Retention</FieldLabel>
            <Slider value={62} aria-label="Retention" />
          </Field>
        </Specimen>
        <Specimen name="select">
          <Select items={selectItems} value="production">
            <SelectTrigger aria-label="Environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {selectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Specimen>
        <Specimen name="native-select">
          <NativeSelect aria-label="Output format" defaultValue="json">
            <NativeSelectOption value="json">JSON</NativeSelectOption>
            <NativeSelectOption value="yaml">YAML</NativeSelectOption>
          </NativeSelect>
        </Specimen>
        <Specimen name="input-otp">
          <InputOTP maxLength={6} value="421907" readOnly aria-label="Verification code">
            <InputOTPGroup>
              {[0, 1, 2].map((index) => (
                <InputOTPSlot index={index} key={index} />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              {[3, 4, 5].map((index) => (
                <InputOTPSlot index={index} key={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </Specimen>
        <Specimen name="field">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="field-name">Domain label</FieldLabel>
              <Input id="field-name" value="Observatory" readOnly />
              <FieldDescription>Visible to every authorized operator.</FieldDescription>
            </Field>
          </FieldGroup>
        </Specimen>
        <Specimen name="label">
          <Label htmlFor="plain-label">Explicit native relationship</Label>
          <Input id="plain-label" value="kernel.Identity" readOnly />
        </Specimen>
      </div>
    </section>
  )
}

function ContentFeedbackSpecimens() {
  return (
    <section id="content-feedback" className="specimen-section" aria-labelledby="content-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">02 · Runtime components</p>
          <h2 id="content-title">Content & feedback</h2>
        </div>
        <Badge variant="outline">14 owners</Badge>
      </div>
      <div className="specimen-grid">
        <Specimen name="alert">
          <Alert>
            <AlertTitle>Revision ready</AlertTitle>
            <AlertDescription>Every declared Function has qualified.</AlertDescription>
          </Alert>
        </Specimen>
        <Specimen name="aspect-ratio">
          <AspectRatio ratio={16 / 9} className="aspect-specimen">
            <span>16:9 preview surface</span>
          </AspectRatio>
        </Specimen>
        <Specimen name="avatar">
          <AvatarGroup>
            <Avatar>
              <AvatarFallback>AD</AvatarFallback>
              <AvatarBadge />
            </Avatar>
            <Avatar>
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+4</AvatarGroupCount>
          </AvatarGroup>
        </Specimen>
        <Specimen name="badge">
          <div className="inline-cluster">
            <Badge>Ready</Badge>
            <Badge variant="secondary">Draft</Badge>
            <Badge variant="outline">Inherited</Badge>
          </div>
        </Specimen>
        <Specimen name="card">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Domain revision</CardTitle>
              <CardDescription>sha256:62d081…</CardDescription>
              <CardAction>
                <Badge>Current</Badge>
              </CardAction>
            </CardHeader>
            <CardFooter>Committed 12 seconds ago</CardFooter>
          </Card>
        </Specimen>
        <Specimen name="empty">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">✦</EmptyMedia>
              <EmptyTitle>No pending admissions</EmptyTitle>
              <EmptyDescription>The graph is quiet.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline">Open journal</Button>
            </EmptyContent>
          </Empty>
        </Specimen>
        <Specimen name="item">
          <ItemGroup>
            <Item variant="outline">
              <ItemMedia variant="icon">↗</ItemMedia>
              <ItemContent>
                <ItemTitle>Kernel host</ItemTitle>
                <ItemDescription>Healthy · 14 ms</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button size="sm" variant="outline">
                  Inspect
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
        </Specimen>
        <Specimen name="kbd">
          <div className="inline-cluster">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            <span>opens the command surface</span>
          </div>
        </Specimen>
        <Specimen name="progress">
          <Progress value={72} aria-label="Release qualification" />
        </Specimen>
        <Specimen name="separator">
          <div className="stack">
            <span>Current generation</span>
            <Separator />
            <span>Previous generation</span>
          </div>
        </Specimen>
        <Specimen name="skeleton">
          <div className="stack">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </Specimen>
        <Specimen name="spinner">
          <Button disabled>
            <Spinner data-icon="inline-start" />
            Qualifying
          </Button>
        </Specimen>
        <Specimen name="table">
          <Table>
            <TableCaption>Recent schema generations</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Revision</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>a02fa1</TableCell>
                <TableCell>Ready</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>9fd013</TableCell>
                <TableCell>Superseded</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Specimen>
        <Specimen name="toast">
          <Button
            variant="outline"
            onClick={() => toast.success('Theme saved', { description: 'Ready to reuse.' })}
          >
            Send toast
          </Button>
        </Specimen>
      </div>
    </section>
  )
}

function NavigationLayoutSpecimens() {
  const [open, setOpen] = useState(false)
  return (
    <section id="navigation-layout" className="specimen-section" aria-labelledby="navigation-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">03 · Runtime components</p>
          <h2 id="navigation-title">Navigation & layout</h2>
        </div>
        <Badge variant="outline">9 owners</Badge>
      </div>
      <div className="specimen-grid">
        <Specimen name="accordion">
          <Accordion defaultValue={['contract']}>
            <AccordionItem value="contract">
              <AccordionTrigger>Public contract</AccordionTrigger>
              <AccordionContent>Every runtime owner has a flat package subpath.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Specimen>
        <Specimen name="breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#components">UI</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Playground</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Specimen>
        <Specimen name="collapsible">
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger render={<Button variant="outline" />}>
              {open ? 'Hide details' : 'Show details'}
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-copy">
              Stateful behavior stays in the component owner.
            </CollapsibleContent>
          </Collapsible>
        </Specimen>
        <Specimen name="direction">
          <DirectionProvider direction="rtl">
            <ButtonGroup>
              <Button variant="outline">First</Button>
              <Button variant="outline">Second</Button>
            </ButtonGroup>
          </DirectionProvider>
        </Specimen>
        <Specimen name="navigation-menu">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="#components">Components</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#registry">Registry</NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </Specimen>
        <Specimen name="pagination">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Specimen>
        <Specimen name="resizable">
          <ResizablePanelGroup orientation="horizontal" className="resizable-specimen">
            <ResizablePanel defaultSize="55%">
              <span>Preview</span>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="45%">
              <span>Inspector</span>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Specimen>
        <Specimen name="scroll-area">
          <ScrollArea className="scroll-specimen">
            {Array.from({ length: 12 }, (_, index) => (
              <Item key={index} size="xs">
                <ItemContent>
                  <ItemTitle>Graph event {String(index + 1).padStart(2, '0')}</ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </ScrollArea>
        </Specimen>
        <Specimen name="tabs">
          <Tabs defaultValue="source">
            <TabsList>
              <TabsTrigger value="source">Source</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="source">Owned source is visible.</TabsContent>
            <TabsContent value="preview">Behavior remains live.</TabsContent>
          </Tabs>
        </Specimen>
      </div>
    </section>
  )
}

function MenuOverlaySpecimens() {
  return (
    <section id="menus-overlays" className="specimen-section" aria-labelledby="overlay-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">04 · Runtime components</p>
          <h2 id="overlay-title">Menus & overlays</h2>
        </div>
        <Badge variant="outline">11 owners</Badge>
      </div>
      <div className="specimen-grid">
        <Specimen name="alert-dialog">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" />}>
              Revoke grant
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke this grant?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action changes authority immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Revoke</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Specimen>
        <Specimen name="command">
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
        </Specimen>
        <Specimen name="context-menu">
          <ContextMenu>
            <ContextMenuTrigger className="context-target">
              Right-click this surface
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuItem>Inspect node</ContextMenuItem>
                <ContextMenuItem>Copy path</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </Specimen>
        <Specimen name="dialog">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Domain label</DialogTitle>
                <DialogDescription>
                  Update presentation without changing identity.
                </DialogDescription>
              </DialogHeader>
              <Input aria-label="Domain label in dialog" value="Observatory" readOnly />
              <DialogFooter showCloseButton>
                <Button>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Specimen>
        <Specimen name="drawer">
          <Drawer showSwipeHandle>
            <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Run details</DrawerTitle>
                <DrawerDescription>Mobile-first operational context.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </Specimen>
        <Specimen name="dropdown-menu">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              More actions
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Domain</DropdownMenuLabel>
                <DropdownMenuItem>Open</DropdownMenuItem>
                <DropdownMenuItem>Inspect</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Specimen>
        <Specimen name="hover-card">
          <HoverCard>
            <HoverCardTrigger render={<Button variant="link" />}>kernel.Identity</HoverCardTrigger>
            <HoverCardContent>
              <strong>Identity</strong>
              <p className="muted-copy">Exact authority-bearing Class.</p>
            </HoverCardContent>
          </HoverCard>
        </Specimen>
        <Specimen name="menubar">
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarGroup>
                  <MenubarItem>Refresh</MenubarItem>
                  <MenubarItem>Open journal</MenubarItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </Specimen>
        <Specimen name="popover">
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>Inspect revision</PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Revision a02fa1</PopoverTitle>
                <PopoverDescription>Qualified on all supported runtimes.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </Specimen>
        <Specimen name="sheet">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>Open inspector</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Theme inspector</SheetTitle>
                <SheetDescription>Every semantic token remains host-addressable.</SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <Button>Apply</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </Specimen>
        <Specimen name="tooltip">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" />}>Hover or focus</TooltipTrigger>
              <TooltipContent>Exact package subpath</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Specimen>
      </div>
    </section>
  )
}

export function ComponentSpecimens() {
  return (
    <div data-slot="component-catalog">
      <ActionInputSpecimens />
      <ContentFeedbackSpecimens />
      <NavigationLayoutSpecimens />
      <MenuOverlaySpecimens />
    </div>
  )
}
