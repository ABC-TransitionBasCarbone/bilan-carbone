import { MobileStepper } from '@mui/material'
import styles from './Stepper.module.css'

interface Props {
  steps: number
  activeStep: number
  fillValidatedSteps?: boolean
}

const Stepper = ({ steps, activeStep, fillValidatedSteps }: Props) => (
  <MobileStepper
    className="mb2"
    classes={{ dot: styles.stepperDots, dotActive: styles.active }}
    style={{ padding: 0 }}
    variant="dots"
    steps={steps}
    position="static"
    activeStep={activeStep - 1}
    sx={{
      flexGrow: 1,
      ...(fillValidatedSteps && {
        [`& .MuiMobileStepper-dot:nth-of-type(-n+${activeStep})`]: {
          backgroundColor: 'var(--primary-40) !important',
        },
      }),
    }}
    nextButton={null}
    backButton={null}
  />
)

export default Stepper
