import { GaugeContainer, GaugePointer, GaugeReferenceArc, GaugeValueArc } from '@mui/x-charts'

const UncertaintyGauge = () => {
  return (
    <GaugeContainer startAngle={-90} endAngle={90} value={0}>
      <GaugeReferenceArc />
      <GaugeValueArc />
      <GaugePointer />
    </GaugeContainer>
  )
}

export default UncertaintyGauge
