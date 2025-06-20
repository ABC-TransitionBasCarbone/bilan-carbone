import { MobileStepper, styled } from '@mui/material'
import classNames from 'classnames'
import styles from './Stepper.module.css'

interface StyledStepperProps {
  fillValidatedSteps?: boolean
  currentActiveStep: number
}

const StyledMobileStepper = styled(MobileStepper, {
  shouldForwardProp: (prop) => prop !== 'fillValidatedSteps' && prop !== 'currentActiveStep',
})<StyledStepperProps>(({ theme, fillValidatedSteps, currentActiveStep }) => ({
  flexGrow: 1,
  '& .MuiMobileStepper-dotActive': {
    backgroundColor: `${theme.palette.secondary.main} !important`,
  },
  ...(fillValidatedSteps && {
    [`& .MuiMobileStepper-dot:nth-of-type(-n+${currentActiveStep})`]: {
      backgroundColor: `${theme.palette.secondary.main} !important`,
    },
  }),
}))

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
  <StyledMobileStepper
    className={classNames(className, 'mb2')}
    classes={{ dot: classNames(styles.stepperDots, { [styles.small]: small }) }}
    variant="dots"
    steps={steps}
    position="static"
    activeStep={activeStep - 1}
    fillValidatedSteps={fillValidatedSteps}
    currentActiveStep={activeStep}
    nextButton={nextButton || null}
    backButton={backButton || null}
  />
)

export default Stepper
