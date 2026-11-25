import Block from '@abc-transitionbascarbone/common/components/base/Block'
import Box from '@abc-transitionbascarbone/common/components/base/Box'
import LinkButton from '@abc-transitionbascarbone/common/components/base/LinkButton'
import Image from '@abc-transitionbascarbone/common/components/document/Image'
import AddIcon from '@mui/icons-material/Add'
import { Box as MUIBox } from '@mui/material'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import BetaBanner from '../base/BetaBanner/BetaBanner'
import styles from './StudiesContainer.module.css'

interface Props {
  simplified: boolean
  creationUrl: string
  showBetaBanner: boolean
}

const CreateFirstStudy = async ({ simplified, creationUrl, showBetaBanner }: Props) => {
  const t = await getTranslations('study')

  return (
    <MUIBox component="section" className="mt1">
      <Block>
        {showBetaBanner && <BetaBanner />}
        <div className="justify-center">
          <Box className={classNames(styles.firstStudyCard, 'flex-col align-center')}>
            <Image src="/img/orga.png" alt="orga.png" width={177} height={119} />
            <h5>{t(simplified ? 'createFirstSimplifiedStudy' : 'createFirstStudy')}</h5>
            <p>{t(simplified ? 'firstSimplifiedStudyMessage' : 'firstStudyMessage')}</p>
            <LinkButton data-testid="new-study" className="w100 justify-center mb1" href={creationUrl}>
              <AddIcon />
              {t(simplified ? 'createFirstSimplifiedStudy' : 'createFirstStudy')}
            </LinkButton>
          </Box>
        </div>
      </Block>
    </MUIBox>
  )
}

export default CreateFirstStudy
