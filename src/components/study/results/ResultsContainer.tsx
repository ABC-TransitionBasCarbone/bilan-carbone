import classNames from 'classnames'
import styles from './styles.module.css'

const ResultsContainer = () => {
  return (
    <div className="px-2">
      <div className={classNames(styles.container, 'w100')}>
        <div className="p-2 flex grow box">
          <div className="box grow">Résultats par postes</div>
          <div className="box grow">Résultats par sous-postes</div>
        </div>
      </div>
    </div>
  )
}

export default ResultsContainer
