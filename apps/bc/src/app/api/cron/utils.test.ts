/** @jest-environment node */

import { assignTrainingStudies } from '@/scripts/formationStudies/assignTrainingStudies'
import { importCourseSessionsFromFTP } from '@/scripts/ftp/importTrainingSessions/importTrainingSessions'
import { NextRequest } from 'next/server'
import { POST as assignStudies } from './assign-training-studies/route'
import { POST as importSessions } from './import-training-sessions/route'

jest.mock('@/scripts/formationStudies/assignTrainingStudies', () => ({ assignTrainingStudies: jest.fn() }))
jest.mock('@/scripts/ftp/importTrainingSessions/importTrainingSessions', () => ({
  importCourseSessionsFromFTP: jest.fn(),
}))

describe.each([
  ['assign-training-studies', assignStudies],
  ['import-training-sessions', importSessions],
])('cron authentication: %s', (cronName, post) => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.replaceProperty(process, 'env', { ...process.env, CRON_SECRET: 'local-cron-test-secret' })
    jest.mocked(importCourseSessionsFromFTP).mockResolvedValue({
      importedSessions: 0,
      modifiedSessions: 0,
      createdUsers: 0,
      createdAccounts: 0,
      addedTrainees: 0,
      addedProfessors: 0,
      deletedSessions: 0,
      deletedTrainees: 0,
      deletedProfessors: 0,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each([
    [undefined, 'Bearer undefined'],
    ['', 'Bearer '],
    ['configured-secret', 'Bearer wrong-secret'],
    ['configured-secret', null],
  ])('does not execute jobs with secret %s and header %s', async (secret, authorization) => {
    if (secret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = secret
    }
    const log = jest.spyOn(console, 'error').mockImplementation()
    const request = new NextRequest(`http://localhost:3000/api/cron/${cronName}`, {
      method: 'POST',
      headers: authorization === null ? {} : { authorization },
    })

    expect((await post(request)).status).toBe(401)
    expect(assignTrainingStudies).not.toHaveBeenCalled()
    expect(importCourseSessionsFromFTP).not.toHaveBeenCalled()
    if (!secret) {
      expect(log).toHaveBeenCalledWith('checkCronRequest: CRON_SECRET is not configured', { cronName })
    }
  })

  it('accepts a Postman-style request with the configured secret and rate-limits a second call', async () => {
    const request = new NextRequest(`http://localhost:3000/api/cron/${cronName}`, {
      method: 'POST',
      headers: { authorization: 'Bearer local-cron-test-secret' },
    })

    expect((await post(request)).status).toBe(200)
    expect(
      jest.mocked(assignTrainingStudies).mock.calls.length + jest.mocked(importCourseSessionsFromFTP).mock.calls.length,
    ).toBe(1)
    expect((await post(request)).status).toBe(429)
    expect(
      jest.mocked(assignTrainingStudies).mock.calls.length + jest.mocked(importCourseSessionsFromFTP).mock.calls.length,
    ).toBe(1)
  })
})
