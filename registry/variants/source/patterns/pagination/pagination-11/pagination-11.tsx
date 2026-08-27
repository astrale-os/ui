import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@astrale-os/ui/pagination'

const NumberlessPaginationDemo = () => {
  return (
    <Pagination>
      <PaginationContent className='w-full justify-between'>
        <PaginationItem>
          <PaginationPrevious href='#' className='border-border border' />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href='#' className='border-border border' />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default NumberlessPaginationDemo
