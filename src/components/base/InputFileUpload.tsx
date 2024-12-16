import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import Button from '@mui/material/Button'
import classNames from 'classnames'
import styles from './InputFileUpload.module.css'

interface Props {
  label: string
}

export default function InputFileUpload({ label }: Props) {
  return (
    <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
      {label}
      <input
        className={classNames(styles.input)}
        type="file"
        onChange={(event) => console.log(event.target.files)}
        multiple
      />
    </Button>
  )
}
