import { bcEnvironments } from '@abc-transitionbascarbone/common/utils/environments'
import { MessageBannerCommandValidation as CommonMessageBannerCommandValidation } from '@abc-transitionbascarbone/common/utils/messageBanner.command'

export const MessageBannerCommandValidation = CommonMessageBannerCommandValidation.refine(
  (data) => data.environments.every((environment) => bcEnvironments.includes(environment)),
  { path: ['environments'], message: 'notAuthorized' },
)
