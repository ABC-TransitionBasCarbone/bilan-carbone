/** @jest-environment node */

import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { sendEmail } from '@abc-transitionbascarbone/common/services/email/send'
import { getTransporter } from '@abc-transitionbascarbone/common/services/email/transposter'
import { expect, it } from '@jest/globals'
import nodemailer from 'nodemailer'

jest.mock('@abc-transitionbascarbone/common/utils/environment', () => ({
  getEnvVar: jest.fn(async () => 'test@example.test'),
}))

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(async () => (key: string) => key),
}))

jest.mock('@abc-transitionbascarbone/common/services/email/transposter', () => ({
  getTransporter: jest.fn(),
}))

it('renders the campaign notification from the common package with its EJS partials', async () => {
  const transporter = nodemailer.createTransport({ jsonTransport: true })
  const sendMail = jest.spyOn(transporter, 'sendMail')
  jest.mocked(getTransporter).mockResolvedValue(transporter)

  await sendEmail(
    Environment.MIP,
    ['mip-admin-0@yopmail.com', 'mip-super_admin-0@yopmail.com'],
    'Campaign notification',
    'campaign-created-by-collaborator',
    {
      link: 'http://localhost:3002/campaigns',
      t_campaignCreatedIntro: 'Campaign created',
      t_campaignCreatedOutro: 'See campaigns',
      campaignNames: ['Campaign notif regression'],
    },
  )

  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'mip-admin-0@yopmail.com,mip-super_admin-0@yopmail.com',
      html: expect.stringContaining('Campaign notif regression'),
      text: expect.stringContaining('Campaign notif regression'),
    }),
  )
})
