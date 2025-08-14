interface Props {
  value: string | number
  label: string
  testId?: string
}

const Data = ({ value, label, testId }: Props) => (
  <div className="flex-col align-center grow" data-testid={testId}>
    <h2>{value}</h2>
    <span className="text-center align-center bold">{label}</span>
  </div>
)

export default Data
