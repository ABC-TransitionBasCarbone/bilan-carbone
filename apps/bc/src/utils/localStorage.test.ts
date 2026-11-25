import { readStoredStringArray } from './localStorage'

describe('readStoredStringArray', () => {
  const key = 'study-filter-subposts-test-study'

  beforeEach(() => {
    localStorage.clear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns null for a missing key without logging an error', () => {
    expect(readStoredStringArray(key)).toBeNull()
    expect(console.error).not.toHaveBeenCalled()
  })

  it.each([[], ['site-a'], ['site-a', 'site-b']])('preserves a valid selection: %j', (...selection) => {
    localStorage.setItem(key, JSON.stringify(selection))

    expect(readStoredStringArray(key)).toEqual(selection)
    expect(console.error).not.toHaveBeenCalled()
  })

  it.each(['invalid-json', '', '{}', 'null', '42', '"site-a"', '["site-a", 42]'])(
    'logs and removes an invalid saved value: %s',
    (stored) => {
      localStorage.setItem(key, stored)
      localStorage.setItem('unrelated-key', 'keep-me')

      expect(readStoredStringArray(key)).toBeNull()
      expect(localStorage.getItem(key)).toBeNull()
      expect(localStorage.getItem('unrelated-key')).toBe('keep-me')
      expect(console.error).toHaveBeenCalledWith(expect.any(String), { key })
    },
  )

  it('does not hide storage access failures', () => {
    const error = new DOMException('Storage is unavailable', 'SecurityError')
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw error
    })

    expect(() => readStoredStringArray(key)).toThrow(error)
  })
})
