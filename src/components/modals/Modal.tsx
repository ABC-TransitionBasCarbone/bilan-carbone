'use client'
import CloseIcon from '@mui/icons-material/Close'
import { ButtonProps, IconButton, Modal as MUIModal, Typography } from '@mui/material'
import classNames from 'classnames'
import Box from '../base/Box'
import Button from '../base/Button'
import LinkButton from '../base/LinkButton'
import LoadingButton, { Props as LoadingButtonProps } from '../base/LoadingButton'
import styles from './Modal.module.css'

export interface Props {
  label: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: React.ReactNode
  className?: string
  big?: boolean
  actions?: ModalAction[]
}

type ModalAction =
  | (ButtonProps & { actionType?: 'button' | 'submit'; 'data-testid'?: string })
  | (LoadingButtonProps & {
      actionType: 'loadingButton'
      onClick: VoidFunction
      'data-testid'?: string
      disabled?: boolean
      color?: 'secondary' | 'error' | 'primary'
    })
  | (ButtonProps & { actionType: 'link'; href?: string; 'data-testid'?: string })

const Modal = ({ className, label, open, onClose, title, children, actions, big }: Props) => (
  <MUIModal
    open={open}
    onClose={onClose}
    aria-labelledby={`${label}-modal-title`}
    aria-describedby={`${label}-modal-description`}
    data-testid={`${label}-modal`}
  >
    <Box className={classNames(styles.box, className, 'flex-col', { [styles.big]: big })}>
      <div className={classNames(title ? 'justify-between mb1' : 'justify-end', 'align-center')}>
        {title && (
          <Typography id={`${label}-modal-title`} variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        )}

        <IconButton color="primary" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      <div className={classNames(styles.content, 'flex-col grow mb1')} id={`${label}-modal-description`}>
        {children}
      </div>

      {actions && actions?.length > 0 && (
        <div className={classNames(styles.actions, 'justify-end')}>
          {actions.map((action, index) => {
            const { actionType, ...props } = action
            if (actionType === 'loadingButton') {
              return <LoadingButton key={index} color="secondary" {...(props as LoadingButtonProps)} />
            }

            if (actionType === 'link') {
              return <LinkButton key={index} color="secondary" {...props} />
            }

            return <Button key={index} type={actionType === 'submit' ? 'submit' : 'button'} {...props} />
          })}
        </div>
      )}
    </Box>
  </MUIModal>
)

export default Modal
