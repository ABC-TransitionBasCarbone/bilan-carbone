import { TrajectoryType } from '@abc-transitionbascarbone/db-common/enums'
import TrajectoryOption from './TrajectoryOption'

interface Props {
  trajectoryType: TrajectoryType | null
  handleModeSelect: (type: TrajectoryType) => void
}

const TrajectoryCreationStep1 = ({ trajectoryType, handleModeSelect }: Props) => {
  const isSBTI = trajectoryType === TrajectoryType.SBTI_15 || trajectoryType === TrajectoryType.SBTI_WB2C
  const isSNBC = trajectoryType === TrajectoryType.SNBC_GENERAL || trajectoryType === TrajectoryType.SNBC_SECTORAL

  return (
    <div className="flex-col gapped1">
      <TrajectoryOption
        type={TrajectoryType.SBTI_15}
        titleKey="sbti.title"
        subtitleKey="sbti.subtitle"
        benefits={['sbti.benefit1', 'sbti.benefit2', 'sbti.benefit3']}
        isSelected={isSBTI}
        handleModeSelect={handleModeSelect}
      />

      <TrajectoryOption
        type={TrajectoryType.SNBC_GENERAL}
        titleKey="snbc.title"
        subtitleKey="snbc.subtitle"
        benefits={['snbc.benefit1', 'snbc.benefit2', 'snbc.benefit3']}
        isSelected={isSNBC}
        handleModeSelect={handleModeSelect}
      />

      <TrajectoryOption
        type={TrajectoryType.CUSTOM}
        titleKey="custom.title"
        subtitleKey="custom.subtitle"
        benefits={['custom.benefit1', 'custom.benefit2', 'custom.benefit3']}
        isSelected={trajectoryType === TrajectoryType.CUSTOM}
        handleModeSelect={handleModeSelect}
      />
    </div>
  )
}

export default TrajectoryCreationStep1
