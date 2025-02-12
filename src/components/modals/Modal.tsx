import Button from '@/components/base/Button'
import { ClickAwayListener } from '@mui/base/ClickAwayListener'
import CloseIcon from '@mui/icons-material/Close'
import { ButtonProps, Dialog, DialogActions, DialogContent, DialogTitle, Button as MUIButton } from '@mui/material'
import classNames from 'classnames'
import { LinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'
import LinkButton from '../base/LinkButton'
import LoadingButton, { Props as LoadingButtonProps } from '../base/LoadingButton'
import styles from './Modal.module.css'

export interface Props {
  label: string
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  actions?: (
    | (ButtonProps & { actionType: 'button' | 'submit'; 'data-testid'?: string })
    | (LoadingButtonProps & ButtonProps & { actionType: 'loadingButton'; 'data-testid'?: string })
    // No idea why i have to add data-testid here :/
    | (LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { actionType: 'link'; 'data-testid'?: string })
  )[]
}

const Modal = ({ label, open, onClose, title, children, actions }: Props) => (
  <Dialog
    open={open}
    aria-labelledby={`${label}-dialog-title`}
    aria-describedby={`${label}-dialog-description`}
    classes={{ paper: styles.dialog }}
  >
    <ClickAwayListener onClickAway={onClose}>
      <div className={styles.container}>
        <div className="justify-end">
          <MUIButton className={styles.closeIcon} onClick={onClose}>
            <CloseIcon />
          </MUIButton>
        </div>
        <DialogTitle id={`${label}-dialog-title`}>{title}</DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          {actions && (
            <div className={classNames(styles.actions, 'flex')}>
              {actions.map(({ actionType, ...action }, index) =>
                actionType === 'button' || actionType === 'submit' ? (
                  <Button key={index} type={actionType} {...(action as ButtonProps)} />
                ) : actionType === 'loadingButton' ? (
                  <LoadingButton key={index} {...(action as LoadingButtonProps)} />
                ) : (
                  <LinkButton key={index} {...(action as LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>)} />
                ),
              )}
            </div>
          )}
        </DialogActions>
      </div>
    </ClickAwayListener>
  </Dialog>
)

export default Modal
