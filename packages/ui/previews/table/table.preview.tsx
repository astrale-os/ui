import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@astrale-os/ui/table'

export const preview = { canvas: 'wide', source: '@shadcn/table' } as const

export default function TablePreview() {
  return (
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
  )
}
