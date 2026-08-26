import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarProvider,
} from './sidebar.js'

export const preview = { canvas: 'wide', source: '@shadcn/sidebar' } as const

export default function SidebarPreview() {
  return (
    <SidebarProvider defaultOpen className="min-h-0">
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Catalog</SidebarGroupLabel>
            <SidebarGroupContent>Components · Patterns · Blocks</SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
