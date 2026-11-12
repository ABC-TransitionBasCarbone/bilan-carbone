export interface HomeCardItem {
  id: string
  name: string
  type: 'client' | 'session'
  href?: string
  startDate?: Date
  endDate?: Date
}
