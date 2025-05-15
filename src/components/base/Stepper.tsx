import { MobileStepper } from '@mui/material'
import classNames from 'classnames'
import styles from './Stepper.module.css'

interface Props {
  steps: number
  activeStep: number
  fillValidatedSteps?: boolean
  className?: string
  small?: boolean
  nextButton?: React.ReactNode
  backButton?: React.ReactNode
}

const Stepper = ({ steps, activeStep, fillValidatedSteps, className, small, nextButton, backButton }: Props) => (
  <MobileStepper
    className={classNames(className, 'mb2')}
    classes={{ dot: classNames(styles.stepperDots, { [styles.small]: small }), dotActive: styles.active }}
    variant="dots"
    steps={steps}
    position="static"
    activeStep={activeStep - 1}
    sx={{
      flexGrow: 1,
      ...(fillValidatedSteps && {
        [`& .MuiMobileStepper-dot:nth-of-type(-n+${activeStep})`]: {
          backgroundColor: 'var(--primary-500) !important',
        },
      }),
    }}
    nextButton={nextButton || null}
    backButton={backButton || null}
  />
)

export default Stepper
