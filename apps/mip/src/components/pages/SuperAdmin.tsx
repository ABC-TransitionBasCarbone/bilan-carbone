'use client'

import { ModelCampaignsWithOrga } from '@/db/campaign'
import { updateModelCampaignCommand } from '@/services/serverFunctions/campaign'
import { UpdateModelCampaignCommand } from '@/services/serverFunctions/modelCampaign.command'
import { Table as BaseTable } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LinkButton from '@abc-transitionbascarbone/components/src/base/LinkButton'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Control, useForm } from 'react-hook-form'

interface Props {
  modelCampaigns: ModelCampaignsWithOrga
}

const SuperAdminPage = ({ modelCampaigns }: Props) => {
  const t = useTranslations('models')
  const router = useRouter()

  const form = useForm<UpdateModelCampaignCommand>({
    defaultValues: {
      modelCampaigns: modelCampaigns.map((modelCampaign) => ({
        ...modelCampaign,
      })),
    },
  })

  const { callServerFunction } = useServerFunction()

  const handleUploadJson = (rowIndex: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const json = JSON.parse(text)
        form.setValue(`modelCampaigns.${rowIndex}.model`, json, {
          shouldDirty: true,
          shouldValidate: true,
        })
      } catch (err) {
        console.error('Invalid JSON file', err)
        alert('Invalid JSON file')
      }
    }

    input.click()
  }

  const onSubmit = async (command: UpdateModelCampaignCommand) => {
    await callServerFunction(() => updateModelCampaignCommand(command), {
      onSuccess: () => {
        router.refresh()
      },
    })
  }
  const control = form?.control as Control<UpdateModelCampaignCommand>

  const columns = [
    {
      id: 'name',
      header: () => <div className="align-center gapped">{t('name')}</div>,
      accessorKey: 'name',
      cell: ({ row, getValue }) => (
        <FormTextField
          data-testid="edit-site-name"
          size="small"
          control={control}
          name={`modelCampaigns.${row.index}.name`}
          placeholder={t('namePlaceholder')}
          fullWidth
        />
      ),
    },
    {
      id: 'upload',
      header: () => t('uploadJson'),
      cell: ({ row }) => (
        <LinkButton onClick={() => handleUploadJson(row.index)}>
          <UploadIcon />
        </LinkButton>
      ),
    },
    {
      id: 'download',
      header: () => t('json'),
      cell: ({ row }) => (
        <LinkButton
          onClick={() => {
            const model = row.original.model
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
      id: 'org',
      header: () => <div>{t('organizationName')}</div>,
      cell: ({ row }) => <span>{row.original.organizationVersionMip?.name ?? '-'}</span>,
    },
  ] as ColumnDef<UpdateModelCampaignCommand['modelCampaigns'][0]>[]

  const table = useReactTable({
    columns,
    data: modelCampaigns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Block as="h1" title={t('editModels')}>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <BaseTable table={table} className="mt1" testId="sites" />
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="edit-organization-button">
          {t('edit')}
        </LoadingButton>
      </Form>
    </Block>
  )
}

export default SuperAdminPage
