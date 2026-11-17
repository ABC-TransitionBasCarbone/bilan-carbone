import {
  MessageBannerCommandValidation as CommonMessageBannerCommandValidation,
  mipMessageBannerEnvironments,
} from '@abc-transitionbascarbone/common/utils/messageBanner.command'

export const MessageBannerCommandValidation = CommonMessageBannerCommandValidation.refine(
  (data) => data.environments.every((environment) => mipMessageBannerEnvironments.includes(environment)),
  { path: ['environments'], message: 'notAuthorized' },
)
