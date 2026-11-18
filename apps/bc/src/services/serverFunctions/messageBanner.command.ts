import { bcEnvironments } from '@abc-transitionbascarbone/common/utils/environments'
import { CommonMessageBannerCommandValidation } from '@abc-transitionbascarbone/common/utils/messageBanner.command'

export const BCMessageBannerCommandValidation = CommonMessageBannerCommandValidation.refine(
  (data) => data.environments.every((environment) => bcEnvironments.includes(environment)),
  { path: ['environments'], message: 'notAuthorized' },
)
