import Block from '@abc-transitionbascarbone/common/components/base/Block'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'
import { getEnvVarClient } from '@abc-transitionbascarbone/common/utils/environmentClient'
import { Alert } from '@mui/material'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface Props {
  environment: Environment
}

const CannotCreateStudy = async ({ environment }: Props) => {
  const t = await getTranslations('study')
  const tLinks = await getTranslations('links')
  const supportEmail = getEnvVarClient('SUPPORT_EMAIL', environment)

  return (
    <Block>
      <Alert
        className="p0"
        severity="info"
        slotProps={{ message: { className: 'grow flex align-center justify-between gapped' } }}
      >
        <div>
          <p>
            {customRich(t, 'cannotCreateStudy', {
              link: (children) => (
                <Link href="https://abc-transitionbascarbone.fr/agir/se-former-au-bilan-carbone/">{children}</Link>
              ),
            })}
          </p>
          <p>
            {customRich(t, 'canCreateFootPrint', {
              link: (children) => <Link href="/mes-empreintes">{children}</Link>,
              faq: (children) => <Link href={tLinks('faqUrl')}>{children}</Link>,
              support: (children) => <Link href={`mailto:${supportEmail}`}>{children}</Link>,
            })}
          </p>
        </div>
      </Alert>
    </Block>
  )
}

export default CannotCreateStudy
