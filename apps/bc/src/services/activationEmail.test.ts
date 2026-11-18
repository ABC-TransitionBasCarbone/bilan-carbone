/** @jest-environment node */

import { getMessages } from '@/i18n/utils'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { Locale } from '@abc-transitionbascarbone/common/i18n/config'
import { sendAccountActivatedEmail } from '@abc-transitionbascarbone/common/services/email/email'
import { sendEmail } from '@abc-transitionbascarbone/common/services/email/send'
import type { AbstractIntlMessages } from 'next-intl'

let mockMessages: AbstractIntlMessages

jest.mock('@abc-transitionbascarbone/common/services/email/send', () => ({ sendEmail: jest.fn() }))

jest.mock('next-intl/server', () => ({
  getTranslations: async (namespace: string) => (key: string) =>
    `${namespace}.${key}`
      .split('.')
      .reduce<string | AbstractIntlMessages | undefined>(
        (value, part) => (typeof value === 'object' ? value[part] : undefined),
        mockMessages,
      ),
}))

test.each([
  {
    environment: Environment.COURSE_BC,
    subject: 'Vous avez activé votre compte sur le BC+',
    content: "Vous venez d'activer votre compte sur le BC+ de formation.",
  },
  {
    environment: Environment.COURSE_TILT,
    subject: 'Vous avez activé votre compte sur Tilt',
    content: "Vous venez d'activer votre compte sur le BC+ de formation pour les associations.",
  },
])('uses the activation email copy for $environment', async ({ environment, subject, content }) => {
  const email = 'trainee@example.test'
  mockMessages = (await getMessages(Locale.FR, environment)).messages

  await sendAccountActivatedEmail(email, environment)

  expect(sendEmail).toHaveBeenLastCalledWith(
    environment,
    [email],
    subject,
    'account-activated',
    expect.objectContaining({ t_accountActivated: content }),
  )
})
