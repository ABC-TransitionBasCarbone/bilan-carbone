import { HomeCardItem } from '@/types/homeCards'
import dayjs from 'dayjs'
import { getVisibleHomeCards, sortHomeCards } from './homeCards'

const correctionClient: HomeCardItem = {
  id: 'correction-client',
  name: 'Zulu corrigé',
  type: 'client',
}
const initialSession: HomeCardItem = {
  id: 'initial-session',
  name: 'Formation initiale',
  type: 'session',
  startDate: new Date('2026-11-01'),
  endDate: new Date('2026-11-05'),
}
const laterSession: HomeCardItem = {
  id: 'later-session',
  name: 'Formation maîtrise',
  type: 'session',
  startDate: new Date('2026-11-10'),
  endDate: new Date('2026-11-15'),
}
const items = [initialSession, correctionClient, laterSession]

describe('sortHomeCards', () => {
  it.each(['clients', 'sessions'] as const)('sorts child clients before sessions in %s', (type) => {
    expect(sortHomeCards(correctionClient, initialSession, type)).toBeLessThan(0)
    expect(sortHomeCards(initialSession, correctionClient, type)).toBeGreaterThan(0)
  })

  it('sorts regular clients alphabetically', () => {
    expect(
      sortHomeCards({ id: 'a', name: 'Alpha', type: 'client' }, { id: 'b', name: 'Beta', type: 'client' }, 'clients'),
    ).toBeLessThan(0)
  })

  it('sorts multiple children alphabetically before sessions', () => {
    const otherChild: HomeCardItem = { id: 'other-child', name: 'Alpha', type: 'client' }
    expect(getVisibleHomeCards([...items, otherChild], 'sessions', '', null, null).map(({ id }) => id)).toEqual([
      'other-child',
      'correction-client',
      'later-session',
      'initial-session',
    ])
    expect(getVisibleHomeCards([...items, otherChild], 'sessions', 'introuvable', dayjs('invalid'), null)).toEqual([
      otherChild,
      correctionClient,
    ])
  })

  it('sorts sessions by newest start date, with names breaking ties', () => {
    expect(sortHomeCards(laterSession, initialSession, 'sessions')).toBeLessThan(0)
    expect(sortHomeCards({ ...laterSession, name: 'Alpha' }, laterSession, 'sessions')).toBeLessThan(0)
  })

  it('sorts undated sessions last and alphabetically', () => {
    const undated: HomeCardItem = { id: 'undated', name: 'Alpha', type: 'session' }
    expect(sortHomeCards(undated, initialSession, 'sessions')).toBeGreaterThan(0)
    expect(sortHomeCards(initialSession, undated, 'sessions')).toBeLessThan(0)
    expect(sortHomeCards(undated, { id: 'other', name: 'Beta', type: 'session' }, 'sessions')).toBeLessThan(0)
    expect(sortHomeCards(undated, undated, 'sessions')).toBe(0)
  })
})

describe('getVisibleHomeCards', () => {
  it('pins the correction client before sessions without mutating the original items', () => {
    expect(getVisibleHomeCards(items, 'sessions', '', null, null).map(({ id }) => id)).toEqual([
      'correction-client',
      'later-session',
      'initial-session',
    ])
    expect(items.map(({ id }) => id)).toEqual(['initial-session', 'correction-client', 'later-session'])
  })

  it.each([
    { search: 'introuvable', start: null, end: null },
    { search: '', start: '2027-01-01', end: null },
    { search: '', start: null, end: '2026-01-01' },
    { search: '', start: 'invalid', end: null },
    { search: '', start: null, end: 'invalid' },
    { search: '', start: '2026-12-01', end: '2026-01-01' },
    { search: 'introuvable', start: 'invalid', end: 'invalid' },
  ])('keeps the correction client visible for $search / $start / $end', ({ search, start, end }) => {
    expect(
      getVisibleHomeCards(items, 'sessions', search, start ? dayjs(start) : null, end ? dayjs(end) : null),
    ).toEqual([correctionClient])
  })

  it('still filters session names case-insensitively and without accents', () => {
    expect(getVisibleHomeCards(items, 'sessions', 'MAITRISE', null, null)).toEqual([correctionClient, laterSession])
  })

  it('preserves inclusive date overlap filtering for sessions', () => {
    expect(getVisibleHomeCards(items, 'sessions', '', dayjs('2026-11-05'), dayjs('2026-11-05'))).toEqual([
      correctionClient,
      initialSession,
    ])
  })

  it('preserves alphabetical client sorting and ignores date filters for clients', () => {
    const clients: HomeCardItem[] = [
      { id: 'b', name: 'Beta', type: 'client' },
      { id: 'a', name: 'Alpha', type: 'client' },
    ]
    expect(getVisibleHomeCards(clients, 'clients', '', dayjs('invalid'), null)).toEqual([clients[1], clients[0]])
    expect(getVisibleHomeCards(clients, 'clients', 'beta', null, null)).toEqual([clients[0]])
  })

  it('returns no results when no item matches and there is no pinned client', () => {
    expect(getVisibleHomeCards([initialSession], 'sessions', 'introuvable', null, null)).toEqual([])
  })
})
