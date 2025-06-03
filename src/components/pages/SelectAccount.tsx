'use client'

import { getUserWithAccountsAndOrganizationsById } from '@/db/user'
import { accountHandler } from '@/services/auth'
import PermIdentityIcon from '@mui/icons-material/PermIdentity'
import { Chip, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Block from '../base/Block'

interface Props {
  user: UserSession
  userWithAccountsAndOrganizations: Awaited<ReturnType<typeof getUserWithAccountsAndOrganizationsById>>
}

const SelectAccount = ({ user, userWithAccountsAndOrganizations }: Props) => {
  const router = useRouter()
  const t = useTranslations('navigation')

  const onSelectAccount = async (accountId: string) => {
    const result = await accountHandler(accountId)
    if (result && !result?.error) {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="grow justify-center">
      <Block title={t('selectAccount')} data-testid="select-account">
        <List>
          {userWithAccountsAndOrganizations?.accounts.map((account) => (
            <ListItem disablePadding key={account.id}>
              <ListItemButton
                selected={user?.accountId === account.id}
                disabled={user?.accountId === account.id}
                onClick={() => onSelectAccount(account.id)}
                data-testid={`account-${account.environment.toLowerCase()}`}
              >
                <ListItemIcon>
                  <PermIdentityIcon />
                </ListItemIcon>
                <ListItemText>
                  <p className="bold mr1">{account.organizationVersion?.organization.name}</p>
                </ListItemText>
                <ListItemText>
                  <Chip className="bold" variant="outlined" label={account.environment} />
                </ListItemText>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Block>
    </div>
  )
}

export default SelectAccount
