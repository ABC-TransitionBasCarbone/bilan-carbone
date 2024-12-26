import { FormControlLabel, Switch } from '@mui/material'
import { useTranslations } from 'next-intl'
interface Props {
  withDependancies: boolean
  setWithDependancies: (value: boolean) => void
}
const DependanciesSwitch = ({ withDependancies, setWithDependancies }: Props) => {
  const t = useTranslations('study.results')

  return (
    <FormControlLabel
      control={<Switch checked={withDependancies} onChange={(event) => setWithDependancies(event.target.checked)} />}
      label={t(withDependancies ? 'withDependancies' : 'withoutDependancies')}
    />
  )
}

export default DependanciesSwitch
