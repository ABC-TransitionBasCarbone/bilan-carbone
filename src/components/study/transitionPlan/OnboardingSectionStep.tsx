import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import LoadingButton from '@/components/base/LoadingButton'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import styles from './OnboardingSectionStep.module.css'

interface Props {
  title: string
  description: string | ReactNode | null
  glossaryLabel: string
  glossaryTitleKey: string
  tModal: string
  isVisible: boolean
  isActive: boolean
  onClickNext: () => void
  nextButtonLabel?: string
  nextButtonLoading?: boolean
  nextButtonDisabled?: boolean
  showNextButton?: boolean
  titleButtonClick?: () => void
  titleButtonLabel?: string
  children: React.ReactNode | null
  showButtonsInTitle?: boolean
}

const OnboardingSectionStep = ({
  title,
  description,
  glossaryLabel,
  glossaryTitleKey,
  tModal,
  isVisible,
  isActive,
  titleButtonClick,
  titleButtonLabel,
  onClickNext,
  nextButtonLabel,
  nextButtonLoading,
  nextButtonDisabled,
  showNextButton = true,
  children,
  showButtonsInTitle,
}: Props) => {
  const tCommon = useTranslations('common')

  if (!isVisible) {
    return null
  }

  return (
    <Box className={classNames('flex-col', styles.stepWrapper, { [styles.active]: isActive })}>
      {isActive ? (
        <div
          className={classNames('flex justify-between items-center p15 gapped1', styles.activeHeader, {
            [styles.activeHeaderWithChildren]: !!children,
          })}
        >
          <div className={classNames('flex-col gapped-2')}>
            <Typography variant="h5" component="h3" fontWeight={600}>
              {title}
            </Typography>
            <p>{description}</p>
          </div>
          {showButtonsInTitle && (
            <div className={classNames('flex gapped-2 align-center items-center', styles.titleButtons)}>
              {titleButtonClick && titleButtonLabel && (
                <Button variant="contained" onClick={titleButtonClick}>
                  {titleButtonLabel}
                </Button>
              )}
              <LoadingButton
                variant="outlined"
                loading={nextButtonLoading ?? false}
                disabled={nextButtonDisabled}
                onClick={onClickNext}
              >
                {nextButtonLabel || tCommon('next')}
              </LoadingButton>
            </div>
          )}
        </div>
      ) : (
        <div className={classNames('flex justify-between items-center p15', styles.inactiveHeader)}>
          <div className={classNames('flex gapped-2 align-center')}>
            <Typography variant="h5" component="h3" fontWeight={600}>
              {title}
            </Typography>
            <GlossaryIconModal label={glossaryLabel} title={glossaryTitleKey} tModal={tModal}>
              <Typography variant="body1">{description}</Typography>
            </GlossaryIconModal>
          </div>
          {titleButtonClick && titleButtonLabel && <Button onClick={titleButtonClick}>{titleButtonLabel}</Button>}
        </div>
      )}

      {!!children && (
        <div className={classNames('flex-col gapped1', styles.stepContent)}>
          {children}
          {!showButtonsInTitle && (
            <div className="flex gapped-2 align-center justify-end">
              {titleButtonClick && titleButtonLabel && (
                <Button variant="contained" onClick={titleButtonClick}>
                  {titleButtonLabel}
                </Button>
              )}
              {showNextButton && onClickNext && (
                <LoadingButton loading={nextButtonLoading ?? false} disabled={nextButtonDisabled} onClick={onClickNext}>
                  {nextButtonLabel || tCommon('next')}
                </LoadingButton>
              )}
            </div>
          )}
        </div>
      )}
    </Box>
  )
}

export default OnboardingSectionStep
