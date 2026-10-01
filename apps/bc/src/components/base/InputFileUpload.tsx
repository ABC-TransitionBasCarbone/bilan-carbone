import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import Button from '@mui/material/Button'
import classNames from 'classnames'
import styles from './InputFileUpload.module.css'

interface Props {
  label: string
  onChange: (value: FileList) => void
}

export default function InputFileUpload({ label, onChange }: Props) {
  return (
    <Button component="label" variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
      {label}
      <input
        className={classNames(styles.input)}
        type="file"
        onChange={(event) => event.target.files && onChange(event.target.files)}
        multiple
      />
    </Button>
  )
}
