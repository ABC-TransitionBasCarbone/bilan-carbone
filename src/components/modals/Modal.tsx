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
  title: React.ReactNode
  children: React.ReactNode
  className?: string
  big?: boolean
  actions?: ModalAction[]
}

type ModalAction =
  | (ButtonProps & { actionType?: 'button' | 'submit'; 'data-testid'?: string })
  | (LoadingButtonProps & { actionType: 'loadingButton'; onClick: VoidFunction; 'data-testid'?: string })
  | (ButtonProps & { actionType: 'link'; href?: string; 'data-testid'?: string })

const Modal = ({ className, label, open, onClose, title, children, actions, big }: Props) => (
  <MUIModal
    open={open}
    onClose={onClose}
    aria-labelledby={`${label}-modal-title`}
    aria-describedby={`${label}-modal-description`}
  >
    <Box className={classNames(styles.box, className, 'flex-col', { [styles.big]: big })}>
      <div className="justify-end">
        <IconButton color="primary" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      <Typography id={`${label}-modal-title`} variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        {title}
      </Typography>

      <div className={classNames(styles.content, 'flex-col grow mb1')} id={`${label}-modal-description`}>
        {children}
      </div>

      {actions && actions?.length > 0 && (
        <div className={classNames(styles.actions, 'justify-end')}>
          {actions.map((action, index) => {
            if (action.actionType === 'loadingButton') {
              const { ...loadingProps } = action
              return <LoadingButton key={index} color="secondary" {...loadingProps} />
            }

            if (action.actionType === 'link') {
              const { ...linkProps } = action
              return <LinkButton key={index} color="secondary" {...linkProps} />
            }

            const { actionType, ...buttonProps } = action
            return <Button key={index} type={actionType === 'submit' ? 'submit' : 'button'} {...buttonProps} />
          })}
        </div>
      )}
    </Box>
  </MUIModal>
)

export default Modal
