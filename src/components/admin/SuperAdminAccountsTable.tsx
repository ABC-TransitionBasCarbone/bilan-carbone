'use client'

import { AccountWithUserAndOrganization } from '@/db/account'
import { Autocomplete, TextField } from '@mui/material'
import { useState } from 'react'
import EditAccountModal from './EditAccountModal'

interface Props {
  accounts: AccountWithUserAndOrganization[]
}

const SuperAdminAccountsTable = ({ accounts }: Props) => {
  const [targetedAccount, setTargetedAccount] = useState<AccountWithUserAndOrganization | null>(null)

  return (
    <>
      <Autocomplete
        options={accounts.filter((acc) => !!acc.user.email)}
        getOptionLabel={(option) => option.user.email || 'No email'}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => <TextField {...params} />}
        onChange={(_, value) => {
          if (value) {
            setTargetedAccount(value)
          }
        }}
        renderOption={(props, option) => (
          <li {...props} key={`account-option-${option.id}`}>
            {option.user.email || 'No email'}
          </li>
        )}
      />
      <EditAccountModal account={targetedAccount} open={!!targetedAccount} onClose={() => setTargetedAccount(null)} />
    </>
  )
}

export default SuperAdminAccountsTable
