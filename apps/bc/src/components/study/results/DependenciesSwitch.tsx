import { FormControlLabel, Switch } from '@mui/material'
import { useTranslations } from 'next-intl'
interface Props {
  withDependencies: boolean
  setWithDependencies: (value: boolean) => void
}
const DependenciesSwitch = ({ withDependencies, setWithDependencies }: Props) => {
  const t = useTranslations('study.results')

  return (
    <FormControlLabel
      control={<Switch checked={withDependencies} onChange={(event) => setWithDependencies(event.target.checked)} />}
      label={t(withDependencies ? 'withDependencies' : 'withoutDependencies')}
    />
  )
}

export default DependenciesSwitch
