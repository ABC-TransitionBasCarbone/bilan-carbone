import { FormControlLabel, Switch } from '@mui/material'
import { useTranslations } from 'next-intl'
interface Props {
  withDependencies: boolean
  setWithDependancies: (value: boolean) => void
}
const DependanciesSwitch = ({ withDependencies, setWithDependancies }: Props) => {
  const t = useTranslations('study.results')

  return (
    <FormControlLabel
      control={<Switch checked={withDependencies} onChange={(event) => setWithDependancies(event.target.checked)} />}
      label={t(withDependencies ? 'withDependencies' : 'withoutDependancies')}
    />
  )
}

export default DependanciesSwitch
