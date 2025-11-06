'use client'

import CloseIcon from '@mui/icons-material/Close'
import { IconButton, Modal as MUIModal, Step, StepLabel, Stepper, Typography } from '@mui/material'
import classNames from 'classnames'
import { ReactNode } from 'react'
import Box from '../base/Box'
import Button from '../base/Button'
import styles from './Modal.module.css'

export interface Props {
  label: string
  open: boolean
  onClose: () => void
  title: React.ReactNode | string
  activeStep: number
  steps: string[]
  children: React.ReactNode
  className?: string
  big?: boolean
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  backLabel?: string
  disableNext?: boolean
  nextButton?: ReactNode
  stepTitles?: string[]
}

const ModalStepper = ({
  className,
  label,
  open,
  onClose,
  title,
  activeStep,
  steps,
  children,
  big,
  onNext,
  onBack,
  nextLabel = 'Suivant',
  backLabel = 'Précédent',
  disableNext = false,
  nextButton,
  stepTitles,
}: Props) => {
  const showBack = activeStep > 0 && onBack
  const showNext = activeStep < steps.length - 1 && onNext
  const currentTitle = stepTitles ? stepTitles[activeStep] : title

  return (
    <MUIModal
      open={open}
      onClose={onClose}
      aria-labelledby={`${label}-modal-title`}
      aria-describedby={`${label}-modal-description`}
      data-testid={`${label}-modal`}
    >
      <Box className={classNames(styles.box, className, 'flex-col p2', { [styles.big]: big })}>
        <div className="justify-between align-center mb1">
          <div className="flex align-center gapped1">
            {stepTitles && (
              <Typography variant="body2" color="textSecondary">
                {activeStep + 1}/{steps.length}
              </Typography>
            )}
            <Typography id={`${label}-modal-title`} variant="h6" sx={{ fontWeight: 'bold' }}>
              {currentTitle}
            </Typography>
          </div>
          <IconButton color="primary" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        {!stepTitles && (
          <Stepper activeStep={activeStep} className="mb2">
            {steps.map((stepLabel, index) => (
              <Step key={index}>
                <StepLabel>{stepLabel}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        <div className={classNames(styles.content, 'flex-col grow mb1')} id={`${label}-modal-description`}>
          {children}
        </div>

        <div className={classNames(styles.actions, 'justify-end')}>
          {showBack && (
            <Button onClick={onBack} variant="outlined">
              {backLabel}
            </Button>
          )}
          {showNext && (
            <Button onClick={onNext} disabled={disableNext}>
              {nextLabel}
            </Button>
          )}
          {nextButton && nextButton}
        </div>
      </Box>
    </MUIModal>
  )
}

export default ModalStepper
