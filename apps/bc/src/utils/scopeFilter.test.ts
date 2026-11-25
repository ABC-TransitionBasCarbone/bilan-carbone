import { resolveFilterIds } from './scopeFilter'

describe('resolveFilterIds', () => {
  const allKey = 'study-filter-sites-all-test-study'
  const filterKey = 'study-filter-sites-test-study'

  beforeEach(() => {
    localStorage.clear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each(['invalid-json', '{}', 'null', '42'])('recovers from invalid saved scope metadata: %s', (storedAll) => {
    localStorage.setItem(allKey, storedAll)

    expect(resolveFilterIds(['site-a'], ['site-a', 'site-b'], allKey, filterKey)).toEqual(['site-a'])
    expect(localStorage.getItem(allKey)).toBeNull()
    expect(console.error).toHaveBeenCalled()
  })

  it('resets a previous select-all when the available scope changes', () => {
    localStorage.setItem(allKey, JSON.stringify(['site-a']))
    localStorage.setItem(filterKey, JSON.stringify(['site-a']))

    expect(resolveFilterIds(['site-a'], ['site-a', 'site-b'], allKey, filterKey)).toBeNull()
    expect(localStorage.getItem(allKey)).toBeNull()
    expect(localStorage.getItem(filterKey)).toBeNull()
  })

  it('preserves an explicit selection and removes unavailable IDs', () => {
    localStorage.setItem(allKey, JSON.stringify(['site-a', 'site-b', 'removed-site']))
    localStorage.setItem(filterKey, JSON.stringify(['site-a', 'removed-site']))

    expect(resolveFilterIds(['site-a', 'removed-site'], ['site-a', 'site-b'], allKey, filterKey)).toEqual(['site-a'])
    expect(localStorage.getItem(filterKey)).toBe(JSON.stringify(['site-a']))
    expect(console.error).not.toHaveBeenCalled()
  })
})
