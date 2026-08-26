import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@astrale-os/ui/pagination'
import { useState } from 'react'

export const preview = { source: '@shadcn/pagination' } as const

export default function PaginationPreview() {
  const [page, setPage] = useState(1)
  return (
    <Pagination>
      <PaginationContent>
        {[1, 2].map((value) => (
          <PaginationItem key={value}>
            <PaginationLink
              href="#"
              isActive={page === value}
              onClick={(event) => {
                event.preventDefault()
                setPage(value)
              }}
            >
              {value}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
