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
        name: 'Liste',
        data: [
          [
            'Date début session',
            'Date fin session',
            'Organisme de formation',
            'Organisation',
            'Nom de Formation',
            'Civilite',
            'Nom',
            'Prenom',
            'Fonction',
            'E-mail',
            'Telephone fixe',
            'Mobile',
            'Adresse',
            'Complement',
            'Code Postal',
            'Ville',
            'Pays',
            'SIRET',
            'Numero Fiscal',
            'TVA',
            'Produits achetés',
            'Code session',
          ],
          ['2026-09-15', '2026-09-16', 'IFC'],
          ['2026-09-17', '2026-09-18', 'Nepsen'],
          ['2026-09-19', '2026-09-20', 'Sami Academy'],
          ['2026-09-21', '2026-09-22', 'take[air]'],
        ],
      },
    ])
    process.env.FTP_TRAINING_SESSIONS_FILE_PATH = '/training/'
    process.env.FTP_TRAINING_SESSIONS_FILE_NAME = 'sessions.xlsx'
  })

  it('reads the training sessions file and confirms success', async () => {
    jest.mocked(fs.createWriteStream).mockReturnValue('stream' as unknown as fs.WriteStream)

    const worksheets = await getTrainingSessionsFromFTP()

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
    expect(worksheets).toEqual([
      {
        name: 'Liste',
        data: [
          { 'Date début session': '2026-09-15', 'Date fin session': '2026-09-16', 'Organisme de formation': 'IFC' },
          { 'Date début session': '2026-09-17', 'Date fin session': '2026-09-18', 'Organisme de formation': 'Nepsen' },
          {
            'Date début session': '2026-09-19',
            'Date fin session': '2026-09-20',
            'Organisme de formation': 'Sami Academy',
          },
          {
            'Date début session': '2026-09-21',
            'Date fin session': '2026-09-22',
            'Organisme de formation': 'take[air]',
          },
        ],
      },
    ])
    expect(consoleLogSpy).toHaveBeenCalledWith([
      {
        name: 'Liste',
        data: [
          { 'Date début session': '2026-09-15', 'Date fin session': '2026-09-16', 'Organisme de formation': 'IFC' },
          { 'Date début session': '2026-09-17', 'Date fin session': '2026-09-18', 'Organisme de formation': 'Nepsen' },
          {
            'Date début session': '2026-09-19',
            'Date fin session': '2026-09-20',
            'Organisme de formation': 'Sami Academy',
          },
          {
            'Date début session': '2026-09-21',
            'Date fin session': '2026-09-22',
            'Organisme de formation': 'take[air]',
          },
        ],
      },
    ])
    expect(consoleLogSpy).toHaveBeenCalledWith('Training sessions file read successfully')
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })
})
