import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@astrale-os/ui/accordion'

export const preview = { source: '@shadcn/accordion' } as const

export default function AccordionPreview() {
  return (
    <Accordion defaultValue={['contract']}>
      <AccordionItem value="contract">
        <AccordionTrigger>Public contract</AccordionTrigger>
        <AccordionContent>Every runtime owner has a flat package subpath.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
