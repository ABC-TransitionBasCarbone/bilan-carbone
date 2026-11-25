export enum HomeCardType {
  Clients = 'clients',
  Session = 'session',
}

export interface HomeCardItem {
  id: string
  name: string
  type: HomeCardType
  href?: string
  startDate?: Date
  endDate?: Date
}
