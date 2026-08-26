import type { ComponentProps, ReactNode } from 'react'

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'

import { cn } from '#astrale-ui/class-name'
import { ChevronDownIcon, ChevronUpIcon } from '#astrale-ui/icon'

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn('flex w-full flex-col', className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('not-last:border-b', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  headerProps,
  collapsedIcon = <ChevronDownIcon />,
  expandedIcon = <ChevronUpIcon />,
  collapsedIconProps,
  expandedIconProps,
  ...props
}: AccordionPrimitive.Trigger.Props & {
  headerProps?: AccordionPrimitive.Header.Props
  collapsedIcon?: ReactNode
  expandedIcon?: ReactNode
  collapsedIconProps?: ComponentProps<'span'>
  expandedIconProps?: ComponentProps<'span'>
}) {
  const { className: headerClassName, ...headerRest } = headerProps ?? {}
  return (
    <AccordionPrimitive.Header
      data-slot="accordion-header"
      className={cn('flex', headerClassName)}
      {...headerRest}
    >
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground',
          className,
        )}
        {...props}
      >
        {children}
        <span
          {...collapsedIconProps}
          data-slot="accordion-trigger-icon"
          className={cn(
            'pointer-events-none ml-auto size-4 shrink-0 group-aria-expanded/accordion-trigger:hidden',
            collapsedIconProps?.className,
          )}
        >
          {collapsedIcon}
        </span>
        <span
          {...expandedIconProps}
          data-slot="accordion-trigger-icon-expanded"
          className={cn(
            'pointer-events-none ml-auto hidden size-4 shrink-0 group-aria-expanded/accordion-trigger:inline',
            expandedIconProps?.className,
          )}
        >
          {expandedIcon}
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  contentProps,
  ...props
}: AccordionPrimitive.Panel.Props & {
  contentProps?: ComponentProps<'div'>
}) {
  const { className: contentClassName, ...contentRest } = contentProps ?? {}
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        data-slot="accordion-content-inner"
        className={cn(
          'h-(--accordion-panel-height) pt-0 pb-2.5 data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
          className,
          contentClassName,
        )}
        {...contentRest}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
