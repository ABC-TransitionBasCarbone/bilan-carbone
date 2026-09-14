import fs from 'fs'
import xlsx from 'node-xlsx'
import { getTrainingSessionsFromFTP } from './importTrainingSessions'

const accessMock = jest.fn()
const downloadToMock = jest.fn()
const closeMock = jest.fn()

jest.mock('basic-ftp', () => ({
  Client: jest.fn(() => ({
    access: accessMock,
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

jest.mock('node-xlsx', () => ({
  __esModule: true,
  default: {
    parse: jest.fn(),
  },
}))

describe('getTrainingSessionsFromFTP', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.FTP_HOST = 'host'
    process.env.FTP_USER = 'user'
    process.env.FTP_PASSWORD = 'password'
    process.env.FTP_PORT = '21'
    jest.mocked(fs.promises.readFile).mockResolvedValue(Buffer.from('xlsx content'))
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'A REMPLIR',
        data: [
          ['Organisme de formation', 'Nom'],
          ['IFC', 'IFC session'],
          ['Other organisation', 'Ignored session'],
          ['take[air]', 'take[air] session'],
          ['Nepsen', 'Nepsen session'],
        ],
      },
      { name: 'Liste', data: [['row 1'], ['row 2'], ['row 3'], ['row 4']] },
    ])
    process.env.FTP_TRAINING_SESSIONS_FILE_PATH = '/training/'
    process.env.FTP_TRAINING_SESSIONS_FILE_NAME = 'sessions.xlsx'
  })

  it('reads the training sessions file and confirms success', async () => {
    jest.mocked(fs.createWriteStream).mockReturnValue('stream' as unknown as fs.WriteStream)

    await getTrainingSessionsFromFTP()

    expect(accessMock).toHaveBeenCalledWith({
      host: 'host',
      user: 'user',
      password: 'password',
      port: 21,
    })
    expect(downloadToMock).toHaveBeenCalledWith('stream', '/training/sessions.xlsx')
    expect(fs.promises.readFile).toHaveBeenCalledWith('sessions.xlsx')
    expect(xlsx.parse).toHaveBeenCalledWith(Buffer.from('xlsx content'))
    expect(closeMock).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith([
      {
        name: 'A REMPLIR',
        data: [
          ['Organisme de formation', 'Nom'],
          ['IFC', 'IFC session'],
          ['take[air]', 'take[air] session'],
        ],
      },
      {
        name: 'Liste',
        data: [['row 1'], ['row 2'], ['row 3']],
      },
    ])
    expect(consoleLogSpy).toHaveBeenCalledWith('Training sessions file read successfully')
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })
})
