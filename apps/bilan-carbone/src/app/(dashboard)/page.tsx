import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserFeedback from '@/components/home/UserFeedback'
import UserView from '@/components/home/UserView'
import Onboarding from '@/components/onboarding/Onboarding'
import { getOrganizationVersionById } from '@/db/organization'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { default as CUTLogosHome } from '@/environments/cut/home/LogosHome'
import { displayFeedBackForm } from '@/services/serverFunctions/user'
import { getFeedbackFormUrl } from '@/utils/ressources'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { environmentWithOnboarding } from '@abc-transitionbascarbone/utils/environments'
import { UserSession } from 'next-auth'
import dynamic from 'next/dynamic'

const ClicksonUserView = dynamic(() => import('@/environments/clickson/home/UserView'))
const FooterClickson = dynamic(() => import('@/environments/clickson/layout/Footer'))
const FooterCut = dynamic(() => import('@/environments/cut/layout/Footer'))
const SimplifiedUserView = dynamic(() => import('@/environments/simplified/home/UserView'))

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => {
  const [userOrganizationVersion, displayFeedback, feedbackFormUrl] = await Promise.all([
    getOrganizationVersionById(account.organizationVersionId),
    displayFeedBackForm(),
    getFeedbackFormUrl(account.environment),
  ])

  const showOnboarding =
    userOrganizationVersion &&
    !userOrganizationVersion.onboarded &&
    environmentWithOnboarding.includes(userOrganizationVersion.environment)

  const isTrainedOrWithoutOrga = (account: UserSession) => account.level || !account.organizationVersionId

  return (
    <>
      <Block>
        <DynamicComponent
          environmentComponents={{
            [Environment.TILT]: isTrainedOrWithoutOrga(account) ? (
              <UserView account={account} feedbackFormUrl={feedbackFormUrl} />
            ) : (
              <SimplifiedUserView account={account} feedbackFormUrl={feedbackFormUrl} />
            ),
            [Environment.CUT]: <SimplifiedUserView account={account} feedbackFormUrl={feedbackFormUrl} />,
            [Environment.CLICKSON]: <ClicksonUserView account={account} feedbackFormUrl={feedbackFormUrl} />,
          }}
          defaultComponent={<UserView account={account} feedbackFormUrl={feedbackFormUrl} />}
          forceEnvironment={account.environment}
        />
        <CUTLogosHome user={account} />

        {showOnboarding && <Onboarding user={account} organizationVersion={userOrganizationVersion!} />}
        {displayFeedback.success && displayFeedback.data && <UserFeedback environment={account.environment} />}
      </Block>
      <DynamicComponent
        environmentComponents={{
          [Environment.CUT]: <FooterCut />,
          [Environment.CLICKSON]: <FooterClickson />,
        }}
      />
    </>
  )
}

export default withAuth(Home)
