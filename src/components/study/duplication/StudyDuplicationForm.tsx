'use client'

import HelpIcon from '@/components/base/HelpIcon'
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import formStyles from '../../form/Form.module.css'
import styles from './StudyDuplication.module.css'

interface Props {
  setGlossary?: (key: string) => void
  onDuplicationOptionsChange?: (inviteTeam: boolean, inviteContributors: boolean) => void
}

const StudyDuplicationForm = ({ setGlossary, onDuplicationOptionsChange }: Props) => {
  const tGlossary = useTranslations('study.new.glossary')
  const tStudy = useTranslations('study.new')
  const [inviteExistingTeam, setInviteExistingTeam] = useState(true)
  const [inviteExistingContributors, setInviteExistingContributors] = useState(true)

  const handleTeamChange = (checked: boolean) => {
    setInviteExistingTeam(checked)
    onDuplicationOptionsChange?.(checked, inviteExistingContributors)
  }

  const handleContributorsChange = (checked: boolean) => {
    setInviteExistingContributors(checked)
    onDuplicationOptionsChange?.(inviteExistingTeam, checked)
  }

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
                  checked={inviteExistingTeam}
                  className={styles.checkbox}
                  onChange={(_, checked) => handleTeamChange(checked)}
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
                  checked={inviteExistingContributors}
                  className={styles.checkbox}
                  onChange={(_, checked) => handleContributorsChange(checked)}
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
