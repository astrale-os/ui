import { Tabs, TabsContent, TabsList, TabsTrigger } from '@astrale-os/ui/tabs'

export const preview = { source: '@shadcn/tabs' } as const

export default function TabsPreview() {
  return (
    <Tabs defaultValue="source">
      <TabsList>
        <TabsTrigger value="source">Source</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="source">Owned source is visible.</TabsContent>
      <TabsContent value="preview">Behavior remains live.</TabsContent>
    </Tabs>
  )
}
