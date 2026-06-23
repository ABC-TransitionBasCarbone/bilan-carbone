'use client'

import { CampaignsWithResponses, ModelCampaignLight } from '@/db/campaign'
import { updateCampaignCommand } from '@/services/serverFunctions/campaign'
import { UpdateCampaignCommand, UpdateCampaignCommandValidation } from '@/services/serverFunctions/campaign.command'
import { Table as BaseTable } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LinkButton from '@abc-transitionbascarbone/components/src/base/LinkButton'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import { TableActionButton } from '@abc-transitionbascarbone/components/src/base/TableActionButton'
import { FormSelect } from '@abc-transitionbascarbone/components/src/form/Select'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import { CampaignStatus } from '@abc-transitionbascarbone/db-common/enums'
import { Button, useToast } from '@abc-transitionbascarbone/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import DownloadIcon from '@mui/icons-material/Download'
import { MenuItem } from '@mui/material'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { Control, useForm, UseFormGetValues, UseFormSetValue, useWatch } from 'react-hook-form'
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
  const { showSuccessToast } = useToast()

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
  const setValue = form?.setValue as UseFormSetValue<UpdateCampaignCommand>
  const getValues = form?.getValues as UseFormGetValues<UpdateCampaignCommand>
  const newCampaign = () =>
    ({
      id: uuidv4(),
      name: '',
      status: CampaignStatus.OPEN,
      modelCampaignId: modelCampaign?.id,
      createdBy: accountMipId,
      allowedAccounts: [accountMipId],
    }) as UpdateCampaignCommand['campaigns'][0]

  const { callServerFunction } = useServerFunction()

  const onSubmit = async (command: UpdateCampaignCommand) => {
    await callServerFunction(() => updateCampaignCommand(command), {
      onSuccess: () => {
        showSuccessToast(t('success'))
        router.refresh()
      },
    })
  }
  const control = form?.control as Control<UpdateCampaignCommand>

  const columns = useMemo(
    () =>
      [
        {
          id: 'name',
          header: () => <div className="align-center gapped">{t('name')}</div>,
          accessorKey: 'name',
          cell: ({ row }) => (
            <FormTextField
              size="small"
              control={control}
              name={`campaigns.${row.index}.name`}
              placeholder={t('namePlaceholder')}
              fullWidth
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
          id: 'download',
          header: () => t('json'),
          cell: ({ row }) => (
            <LinkButton
              onClick={() => {
                const model = modelCampaign?.model
                const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)

                const a = document.createElement('a')
                a.href = url
                a.download = `${row.original.name}.json`
                a.click()

                URL.revokeObjectURL(url)
              }}
            >
              <DownloadIcon />
            </LinkButton>
          ),
        },
        {
          id: 'responses',
          header: () => t('responsesCount'),
          accessorKey: 'responsesCount',
          cell: ({ row }) => {
            const count = campaigns.find((campaign) => (campaign.id = row.original.id))?._count.responses
            return <div>{count}</div>
          },
        },
        {
          id: 'actions',
          header: '',
          accessorKey: 'id',
          cell: ({ getValue }) => (
            <TableActionButton
              type="delete"
              onClick={() => {
                const id = getValue<string>()
                setValue(
                  'campaigns',
                  getValues('campaigns').filter((campaign) => campaign.id !== id),
                )
              }}
            />
          ),
        },
      ] as ColumnDef<UpdateCampaignCommand['campaigns'][0]>[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [control, t],
  )

  const currentcampaigns = useWatch({ control, name: 'campaigns' })

  const table = useReactTable({
    columns,
    data: currentcampaigns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Block as="h1" title={t('editCampaigns')}>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <BaseTable table={table} className="mt1" testId="sites" />
        <div className="mt1 justify-end">
          <Button type="button" onClick={() => setValue('campaigns', [...currentcampaigns, newCampaign()])}>
            {t('add')}
          </Button>
        </div>
        <LoadingButton type="submit" loading={form.formState.isSubmitting}>
          {t('edit')}
        </LoadingButton>
      </Form>
    </Block>
  )
}

export default CampaignsPage
