export type PaginationData<T> = {
  data: T
  pagination: {
    totalElements: number
    perPage: number
    page: number
    sortBy: {
      [K in keyof T]?: 'ASC' | 'DESC'
    }
  }
}
