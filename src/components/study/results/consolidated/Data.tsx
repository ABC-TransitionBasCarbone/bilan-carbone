interface Props {
  value: string | number
  label: string
}

const Data = ({ value, label }: Props) => (
  <div className="flex-col align-center grow">
    <h2>{value}</h2>
    <span className="text-center align-center bold">{label}</span>
  </div>
)

export default Data
