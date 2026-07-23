'use client'

import type { CampaignsWithResponses, ModelCampaignLight } from '@/db/campaign'
import { updateCampaignCommand } from '@/services/serverFunctions/campaign'
import { UpdateCampaignCommand, UpdateCampaignCommandValidation } from '@/services/serverFunctions/campaign.command'
import { exportSurveyResponsesToCSV } from '@/services/serverFunctions/survey'
import { handleCopy } from '@/utils/campaign'
import { Table as BaseTable, HelpIcon } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LinkButton from '@abc-transitionbascarbone/components/src/base/LinkButton'
import { FormSelect } from '@abc-transitionbascarbone/components/src/form/Select'
import GlossaryModal from '@abc-transitionbascarbone/components/src/modals/GlossaryModal'
import { CampaignStatus } from '@abc-transitionbascarbone/db-common/enums'
import { Button, useToast } from '@abc-transitionbascarbone/ui'
import { downloadCsvFile } from '@abc-transitionbascarbone/utils/download'
import { zodResolver } from '@hookform/resolvers/zod'
import BarChartIcon from '@mui/icons-material/BarChart'
import CopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import { IconButton, MenuItem, TextField, Tooltip } from '@mui/material'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
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
  const [displayCampaignHelp, setDisplayCampaignHelp] = useState(false)

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

  const handleDelete = useCallback(
    (id: string) => {
      form.setValue(
        'campaigns',
        form.getValues('campaigns').filter((campaign) => campaign.id !== id),
      )
    },
    [form],
  )

  const control = form.control

  const handleExportCampaignCsv = useCallback(
    async (campaignId: string, campaignName: string) => {
      const result = await exportSurveyResponsesToCSV(campaignId)
      if (!result.success) {
        showErrorToast(result.errorMessage)
        return
      }

      downloadCsvFile(result.data.fileName ?? `${campaignName}-reponses-utilisateurs.csv`, result.data.csvContent)
    },
    [showErrorToast],
  )

  const columns = useMemo(
    () =>
      [
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
              )}
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
            <LinkButton href={`/campaigns/${row.original.id}`} target="_blank" rel="noopener noreferrer">
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
            const link = typeof window !== 'undefined' ? `${window.location.origin}/${row.original.id}/survey` : ''

            return (
              <LinkButton onClick={() => handleCopy(link)}>
                <CopyIcon />
              </LinkButton>
            )
          },
        },
        {
          id: 'exportCsv',
          header: () => t('exportCsv'),
          cell: ({ row }) => (
            <Tooltip title={t('exportCsv')}>
              <IconButton
                size="medium"
                color="primary"
                data-testid={`export-campaign-csv-${row.original.id}`}
                onClick={() => handleExportCampaignCsv(row.original.id, row.original.name)}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ),
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
      ] as ColumnDef<UpdateCampaignCommand['campaigns'][0]>[],
    [campaigns, control, handleDelete, handleExportCampaignCsv, t],
  )

  const currentCampaigns = useWatch({ control, name: 'campaigns' }) ?? []

  const table = useReactTable({
    columns,
    data: currentCampaigns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <Block
        as="h2"
        title={t('editCampaigns')}
        icon={<HelpIcon onClick={() => setDisplayCampaignHelp(true)} label={t('guide.title')} />}
        iconPosition="after"
        expIcon
      >
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
      {displayCampaignHelp && (
        <GlossaryModal
          glossary="guide.title"
          label="campaign-guide"
          t={t}
          onClose={() => setDisplayCampaignHelp(false)}
        >
          <p>{t('guide.description')}</p>
          <p>
            <b>{t('guide.resultsTitle')}</b> {t('guide.resultsDescription')}
          </p>
          <p>
            <b>{t('guide.csvTitle')}</b> {t('guide.csvDescription')}
          </p>
          <p>
            <b>{t('guide.shareTitle')}</b> {t('guide.shareDescription')}
          </p>
        </GlossaryModal>
      )}
    </>
  )
}

export default CampaignsPage
