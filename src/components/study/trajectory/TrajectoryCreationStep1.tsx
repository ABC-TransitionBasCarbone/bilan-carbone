import { TrajectoryType } from '@prisma/client'
import TrajectoryOption from './TrajectoryOption'

interface Props {
  trajectoryType: TrajectoryType | null
  handleModeSelect: (type: TrajectoryType) => void
}

const TrajectoryCreationStep1 = ({ trajectoryType, handleModeSelect }: Props) => {
  const isSBTI = trajectoryType === TrajectoryType.SBTI_15 || trajectoryType === TrajectoryType.SBTI_WB2C

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
        type={TrajectoryType.SNBC}
        titleKey="snbc.title"
        subtitleKey="snbc.subtitle"
        benefits={['snbc.benefit1', 'snbc.benefit2', 'snbc.benefit3']}
        isSelected={false}
        disabled
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
