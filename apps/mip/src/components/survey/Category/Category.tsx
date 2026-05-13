import styles from './Category.module.css'

type Props = {
  icons?: string
  title?: string
}

export default function Category({ icons, title }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        {icons} {title}
      </div>
    </div>
  )
}