'use client'

import HelpIcon from '@/components/base/HelpIcon'
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import formStyles from '../../form/Form.module.css'
import styles from './StudyDuplication.module.css'

export interface InviteOptions {
  team: boolean
  contributors: boolean
}

interface Props {
  setGlossary?: (key: string) => void
  inviteOptions: InviteOptions
  setInviteOptions: (options: InviteOptions) => void
}

const StudyDuplicationForm = ({ setGlossary, inviteOptions, setInviteOptions }: Props) => {
  const tGlossary = useTranslations('study.new.glossary')
  const tStudy = useTranslations('study.new')

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend" className="mb-2">
        <div className={classNames(formStyles.gapped, 'align-center')}>
          <span className="inputLabel bold">{tStudy('duplicationOptions')}</span>
          {setGlossary && (
            <div className={formStyles.icon}>
              <HelpIcon onClick={() => setGlossary('duplicationOptions')} label={tGlossary('title')} />
            </div>
          )}
        </div>
      </FormLabel>
      <FormGroup>
        <div className={classNames(styles.duplicationOptions, 'flex-column')}>
          <div className={classNames(styles.container, 'flex')}>
            <FormControlLabel
              className={styles.field}
              control={
                <Checkbox
                  checked={inviteOptions?.team}
                  className={styles.checkbox}
                  onChange={(_, checked) => setInviteOptions({ ...inviteOptions, team: checked })}
                />
              }
              label={tStudy('inviteTeam')}
            />
          </div>
          <div className={styles.container}>
            <FormControlLabel
              className={styles.field}
              control={
                <Checkbox
                  checked={inviteOptions?.contributors}
                  className={styles.checkbox}
                  onChange={(_, checked) => setInviteOptions({ ...inviteOptions, contributors: checked })}
                />
              }
              label={tStudy('inviteContributors')}
            />
          </div>
        </div>
      </FormGroup>
    </FormControl>
  )
}

export default StudyDuplicationForm
