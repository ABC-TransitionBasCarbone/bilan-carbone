import { expect } from '@jest/globals'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import {
  sendAddedActiveUserEmail,
  sendActiveUserOnStudyInvitationEmail,
  sendPendingStudyInvitationApprovalEmail,
} from '@abc-transitionbascarbone/common/services/email/email'
import { sendEmail } from '@abc-transitionbascarbone/common/services/email/send'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(async () => (key: string) => key),
}))
jest.mock('@abc-transitionbascarbone/common/services/email/send', () => ({
  sendEmail: jest.fn(),
}))
jest.mock('@abc-transitionbascarbone/common/services/email/utils', () => ({
  getEnvResetLink: jest.fn(() => '/count/reset-password/token'),
}))

const mockSendEmail = sendEmail as jest.Mock

describe('study invitation email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends an activation link and includes the study role for active users', async () => {
    await sendActiveUserOnStudyInvitationEmail(
      'user@example.com',
      'token',
      'Study',
      'Organization',
      'Study owner',
      'editor',
      Environment.CUT,
    )

    expect(mockSendEmail).toHaveBeenCalledWith(
      Environment.CUT,
      ['user@example.com'],
      'userOnStudyInvitation',
      'active-user-study-invitation',
      expect.objectContaining({
        link: '/count/reset-password/token',
        t_added: 'userOnStudyInvitation.added',
        t_access: 'activeUserOnStudyInvitation.access',
      }),
    )
  })

  it('uses the study invitation content when emailing an active user added to an environment', async () => {
    await sendAddedActiveUserEmail(
      'user@example.com',
      'Study owner',
      'Contributor',
      Environment.CUT,
      [Environment.BC],
      'Organization',
      { studyName: 'Study', organizationName: 'Organization', roleOnStudy: 'editor' },
    )

    expect(mockSendEmail).toHaveBeenCalledWith(
      Environment.CUT,
      ['user@example.com'],
      'userOnStudyInvitation',
      'added-active-user',
      expect.objectContaining({ t_added: 'userOnStudyInvitation.added' }),
    )
  })

  it('sends a pending-approval notification without an activation link', async () => {
    await sendPendingStudyInvitationApprovalEmail(
      'user@example.com',
      'Contributor',
      'Study',
      'Organization',
      Environment.CUT,
    )

    expect(mockSendEmail).toHaveBeenCalledWith(
      Environment.CUT,
      ['user@example.com'],
      'pendingStudyInvitationApproval',
      'pending-study-invitation',
      expect.objectContaining({
        t_helloName: 'helloName',
        t_content: 'pendingStudyInvitationApproval.content',
      }),
    )
  })
})
