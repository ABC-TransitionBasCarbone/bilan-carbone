import classNames from 'classnames'
import styles from './ResultsContainer.module.css'
import Box from '@/components/base/Box'

const ResultsContainer = () => {
  return (
    <div className="pb1">
      <div className={classNames(styles.container, 'w100')}>
        <Box className={classNames(styles.resultsWrapper, 'p-2 flex grow')}>
          <Box className="grow">Résultats par postes</Box>
          <Box className="grow">Résultats par sous-postes</Box>
        </Box>
      </div>
    </div>
  )
}

export default ResultsContainer
