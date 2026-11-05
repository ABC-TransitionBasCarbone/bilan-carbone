import { getInitialAttendanceSelection } from './courseSessionAttendance'

describe('getInitialAttendanceSelection', () => {
  it('selects everyone when no attendance exists, deduplicating organizations and excluding missing ones', () => {
    expect(
      getInitialAttendanceSelection([
        { organizationVersionId: 'one', attendance: null },
        { organizationVersionId: 'one', attendance: null },
        { organizationVersionId: 'two', attendance: null },
        { organizationVersionId: null, attendance: null },
      ]),
    ).toEqual(['one', 'two'])
  })

  it('restores only recorded attendance when some trainees have already signed in', () => {
    expect(
      getInitialAttendanceSelection([
        { organizationVersionId: 'one', attendance: { id: 'attendance' } },
        { organizationVersionId: 'two', attendance: null },
      ]),
    ).toEqual(['one'])
  })

  it('returns an empty selection for an empty session', () => {
    expect(getInitialAttendanceSelection([])).toEqual([])
  })
})
