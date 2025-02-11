import Button from '@/components/base/Button'
import { ClickAwayListener } from '@mui/base/ClickAwayListener'
import CloseIcon from '@mui/icons-material/Close'
import { ButtonProps, Dialog, DialogActions, DialogContent, DialogTitle, Button as MUIButton } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { LinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'
import LinkButton from './LinkButton'
import LoadingButton, { Props as LoadingButtonProps } from './LoadingButton'
import styles from './Modal.module.css'

interface Props {
  label: string
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  t: ReturnType<typeof useTranslations>
  actions?: (
    | (ButtonProps & { actionType: 'button'; 'data-testid'?: string })
    | (LoadingButtonProps & ButtonProps & { actionType: 'loadingButton' })
    // No idea why i have to add data-testid here :/
    | (LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { actionType: 'link'; 'data-testid'?: string })
  )[]
}

const Modal = ({ label, open, onClose, title, children, actions, t }: Props) => {
  return (
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
          <DialogTitle id={`${label}-dialog-title`}>{t(title)}</DialogTitle>
          <DialogContent>{children}</DialogContent>
          <DialogActions>
            {actions && (
              <div className={classNames(styles.actions, 'flex')}>
                {actions.map(({ actionType, ...action }, index) =>
                  actionType === 'button' ? (
                    <Button key={index} {...(action as ButtonProps)} />
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
}

export default Modal
