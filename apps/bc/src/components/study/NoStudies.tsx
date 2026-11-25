import Block from '@abc-transitionbascarbone/common/components/base/Block'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'
import { getTranslations } from 'next-intl/server'

const NoStudies = async () => {
  const t = await getTranslations('common')

  return <Block>{customRich(t, 'noStudies')}</Block>
}

export default NoStudies
