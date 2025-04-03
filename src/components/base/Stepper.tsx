import { MobileStepper } from '@mui/material'
import classNames from 'classnames'
import styles from './Stepper.module.css'

interface Props {
  steps: number
  activeStep: number
  fillValidatedSteps?: boolean
  className?: string
  small?: boolean
}

const Stepper = ({ steps, activeStep, fillValidatedSteps, className, small }: Props) => (
  <MobileStepper
    className={classNames(className, 'mb2')}
    classes={{ dot: classNames(styles.stepperDots, { [styles.small]: small }), dotActive: styles.active }}
    style={{ padding: 0 }}
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
    nextButton={null}
    backButton={null}
  />
)

export default Stepper
