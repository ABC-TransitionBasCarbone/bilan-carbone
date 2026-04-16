import fs from 'fs'
import { getUsersFromFTP } from './importUsers'
import { processUsers } from './userImport'

const accessMock = jest.fn()
const listMock = jest.fn()
const downloadToMock = jest.fn()
const closeMock = jest.fn()

jest.mock('basic-ftp', () => ({
  Client: jest.fn(() => ({
    access: accessMock,
    list: listMock,
    downloadTo: downloadToMock,
    close: closeMock,
  })),
}))

jest.mock('fs', () => {
  const mockedFs = {
    createWriteStream: jest.fn(),
    promises: {
      readFile: jest.fn(),
    },
  }

  return {
    __esModule: true,
    default: mockedFs,
    ...mockedFs,
  }
})

jest.mock('./userImport', () => ({
  processUsers: jest.fn(),
}))

describe('getUsersFromFTP', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.FTP_HOST = 'host'
    process.env.FTP_USER = 'user'
    process.env.FTP_PASSWORD = 'password'
    process.env.FTP_PORT = '21'
    process.env.FTP_FILE_PATH = '/ftp/'
    process.env.FTP_FILE_NAME = 'users.json'
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('downloads and processes users from FTP', async () => {
    const importedAt = '2026-01-01T00:00:00.000Z'
    const values = [{ userEmail: 'user@test.com' }]

    ;(fs.createWriteStream as jest.Mock).mockReturnValue('stream')
    ;(fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(values))
    listMock.mockResolvedValue([{ name: 'users.json', rawModifiedAt: importedAt }])

    await getUsersFromFTP()

    expect(accessMock).toHaveBeenCalledWith({
      host: 'host',
      user: 'user',
      password: 'password',
      port: 21,
    })
    expect(listMock).toHaveBeenCalledWith('/ftp/')
    expect(downloadToMock).toHaveBeenCalledWith('stream', '/ftp/users.json')
    expect(processUsers).toHaveBeenCalledWith(values, new Date(importedAt))
    expect(closeMock).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('logs and throws when FTP import fails', async () => {
    const error = new Error('download failed')
    ;(fs.createWriteStream as jest.Mock).mockReturnValue('stream')
    listMock.mockResolvedValue([{ name: 'users.json', rawModifiedAt: '2026-01-01T00:00:00.000Z' }])
    downloadToMock.mockRejectedValue(error)

    await expect(getUsersFromFTP()).rejects.toThrow('download failed')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error importing users:', error)
    expect(closeMock).toHaveBeenCalledTimes(1)
  })
})
