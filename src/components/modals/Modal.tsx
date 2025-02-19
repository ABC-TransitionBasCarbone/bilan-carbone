import Button from '@/components/base/Button'
import CloseIcon from '@mui/icons-material/Close'
import { ButtonProps, Button as MUIButton, Modal as MUIModal, Typography } from '@mui/material'
import classNames from 'classnames'
import { LinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import LoadingButton, { Props as LoadingButtonProps } from '../base/LoadingButton'
import styles from './Modal.module.css'

export interface Props {
  label: string
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  wide?: boolean
  actions?: (
    | (ButtonProps & { actionType: 'button' | 'submit'; 'data-testid'?: string })
    | (LoadingButtonProps & ButtonProps & { actionType: 'loadingButton'; 'data-testid'?: string })
    // No idea why i have to add data-testid here :/
    | (LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { actionType: 'link'; 'data-testid'?: string })
  )[]
}

const Modal = ({ label, open, onClose, title, children, actions, wide }: Props) => (
  <MUIModal
    open={open}
    onClose={onClose}
    aria-labelledby={`${label}-modale-title`}
    aria-describedby={`${label}-modale-description`}
  >
    <Box className={classNames(styles.box, 'flex-col', { [styles.wideBox]: wide })}>
      <div className="justify-end">
        <MUIButton className={styles.closeIcon} onClick={onClose}>
          <CloseIcon />
        </MUIButton>
      </div>
      <Typography id={`${label}-modale-title`} variant="h6" sx={{ fontWeight: 'bold', marginBottom: '1rem' }}>
        {title}
      </Typography>
      <div className={classNames(styles.content, 'flex-col grow')} id={`${label}-modale-description`}>
        {children}
      </div>
      {actions && (
        <div className={classNames(styles.actions, 'justify-end')}>
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
    </Box>
  </MUIModal>
)

export default Modal
