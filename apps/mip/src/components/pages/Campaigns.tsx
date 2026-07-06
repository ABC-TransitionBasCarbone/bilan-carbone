'use client'

import type { CampaignsWithResponses, ModelCampaignLight } from '@/db/campaign'
import { updateCampaignCommand } from '@/services/serverFunctions/campaign'
import { UpdateCampaignCommand, UpdateCampaignCommandValidation } from '@/services/serverFunctions/campaign.command'
import { handleCopy } from '@/utils/campaign'
import { Table as BaseTable } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LinkButton from '@abc-transitionbascarbone/components/src/base/LinkButton'
import { Select } from '@abc-transitionbascarbone/components/src/base/Select'
import { CampaignStatus } from '@abc-transitionbascarbone/db-common/enums'
import { Button, useToast } from '@abc-transitionbascarbone/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import BarChartIcon from '@mui/icons-material/BarChart'
import CopyIcon from '@mui/icons-material/ContentCopy'
import { MenuItem } from '@mui/material'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import { FormControl, FormHelperText, IconButton, MenuItem, TextField, Tooltip } from '@mui/material'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import styles from './Campaign.module.css'

interface Props {
  campaigns: CampaignsWithResponses
  modelCampaign: ModelCampaignLight
  accountMipId: string
}

const CampaignsPage = ({ campaigns, modelCampaign, accountMipId }: Props) => {
  const t = useTranslations('campaigns')
  const router = useRouter()
  const { showErrorToast, showSuccessToast } = useToast()

  const form = useForm<UpdateCampaignCommand>({
    resolver: zodResolver(UpdateCampaignCommandValidation),
    defaultValues: {
      campaigns: campaigns.map((campaign) => ({
        ...campaign,
        allowedAccounts: campaign.allowedAccounts.map((allowedAccount) => allowedAccount.accountMipId),
        createdBy: campaign.createdBy.id,
      })),
    },
  })

  const newCampaign = () =>
    ({
      id: uuidv4(),
      name: '',
      status: CampaignStatus.OPEN,
      modelCampaignId: modelCampaign?.id,
      createdBy: accountMipId,
      allowedAccounts: [accountMipId],
    }) as UpdateCampaignCommand['campaigns'][0]

  const onSubmit = async (command: UpdateCampaignCommand) => {
    const result = await updateCampaignCommand(command)

    if (result.success) {
      showSuccessToast(t('success'))
      router.refresh()
      return
    }

    showErrorToast(result.errorMessage)
  }

  const handleDelete = (id: string) => {
    form.setValue(
      'campaigns',
      form.getValues('campaigns').filter((campaign) => campaign.id !== id),
    )
  }

  const control = form.control

  const columns = [
    {
      id: 'name',
      header: () => <div className="align-center gapped">{t('name')}</div>,
      accessorKey: 'name',
      cell: ({ row }) => (
        <Controller
          control={control}
          name={`campaigns.${row.index}.name`}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              size="small"
              placeholder={t('namePlaceholder')}
              fullWidth
              error={!!error}
              helperText={error?.message}
              slotProps={{
                htmlInput: {
                  'data-testid': `input-name-${row.original.id}`,
                },
              }}
            />
          ),
        },
        {
          id: 'status',
          header: t('status'),
          accessorKey: 'status',
          cell: ({ row }) => (
            <FormSelect
              control={control}
              translation={t}
              name={`campaigns.${row.index}.status`}
              className={styles.select}
            >
              {Object.keys(CampaignStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {t(status)}
                </MenuItem>
              ))}
            </FormSelect>
          ),
        },
        {
          id: 'results',
          header: () => t('viewResults'),
          cell: ({ row }) => (
            <LinkButton href={`/survey/${row.original.id}/results`} target="_blank" rel="noopener noreferrer">
              <BarChartIcon />
            </LinkButton>
          ),
        },
        {
          id: 'responses',
          header: () => t('responsesCount'),
          accessorKey: 'responsesCount',
          cell: ({ row }) => {
            const count = campaigns.find((campaign) => campaign.id === row.original.id)?._count.responses || 0
            return <div>{count}</div>
          },
        },
        {
          id: 'shareLink',
          header: () => <div>{t('shareLink')}</div>,
          cell: ({ row }) => {
            const link = typeof window !== 'undefined' ? `${window.location.origin}/survey/${row.original.id}` : ''

        return (
          <LinkButton onClick={() => handleCopy(link)}>
            <CopyIcon />
          </LinkButton>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      accessorKey: 'id',
      cell: ({ getValue }) => (
        <Tooltip title={t('delete')}>
          <IconButton size="medium" color="primary" onClick={() => handleDelete(getValue<string>())}>
            <DeleteOutlinedIcon color="error" fontSize="medium" />
          </IconButton>
        </Tooltip>
      ),
    },
  ] as ColumnDef<UpdateCampaignCommand['campaigns'][0]>[]

  const currentCampaigns = useWatch({ control, name: 'campaigns' }) ?? []

  const table = useReactTable({
    columns,
    data: currentCampaigns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Block as="h1" title={t('editCampaigns')}>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <BaseTable table={table} className="mt1" testId="sites" />
        <div className="mt1 justify-end">
          <Button
            type="button"
            onClick={() => form.setValue('campaigns', [...currentCampaigns, newCampaign()])}
            data-testid="add-campaign-button"
          >
            {t('add')}
          </Button>
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} data-testid="validate-campaign-update">
          {t('edit')}
        </Button>
      </Form>
    </Block>
  )
}

export default CampaignsPage
