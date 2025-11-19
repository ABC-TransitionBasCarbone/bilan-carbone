import Button from '@/components/base/Button'
import LinkButton from '@/components/base/LinkButton'
import BaseTable from '@/components/base/Table'
import { FullStudy } from '@/db/study'
import DeleteIcon from '@mui/icons-material/Cancel'
import { ExternalStudy } from '@prisma/client'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

interface Props {
  transitionPlanId: string
  linkedStudies: FullStudy[]
  externalStudies: ExternalStudy[]
  canEdit: boolean
}

type Study = {
  id: string
  name: string
  year: number
  type: 'linked' | 'external'
}

const LinkedStudiesTable = ({ transitionPlanId, linkedStudies, externalStudies, canEdit }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.linkedStudies.table')

  const deleteLinkedStudy = useCallback(
    (studyId: string) => {
      console.log('deleteLinkedStudy : ', studyId)
      console.log('transitionPlanId : ', transitionPlanId)
    },
    [transitionPlanId],
  )

  const deleteExternalStudy = useCallback(
    (id: string) => {
      console.log('deleteExternalStudy : ', id)
      console.log('transitionPlanId : ', transitionPlanId)
    },
    [transitionPlanId],
  )

  const mergedStudies = useMemo(
    () => [
      ...linkedStudies.map((study) => ({
        id: study.id,
        name: study.name,
        year: study.startDate.getFullYear(),
        type: 'linked' as const,
      })),
      ...externalStudies.map((study) => ({
        id: study.id,
        name: study.name,
        year: study.date.getFullYear(),
        type: 'external' as const,
      })),
    ],
    [linkedStudies, externalStudies],
  )

  const mergedColumns = useMemo(
    () =>
      [
        { header: t('name'), accessorKey: 'name' },
        { header: t('year'), accessorKey: 'year' },
        {
          header: '',
          accessorKey: 'id',
          cell: ({ row }) => (
            <div className="align-center">
              {row.original.type === 'linked' ? (
                <>
                  {canEdit && (
                    <Button
                      aria-label={t('delete')}
                      title={t('delete')}
                      onClick={() => deleteLinkedStudy(row.original.id)}
                      data-testid={`delete-linked-study-button`}
                      color="error"
                      variant="text"
                    >
                      <DeleteIcon />
                    </Button>
                  )}

                  <LinkButton href={`/etudes/${row.original.id}`}>{t('see')}</LinkButton>
                </>
              ) : canEdit ? (
                <Button
                  aria-label={t('delete')}
                  title={t('delete')}
                  onClick={() => deleteExternalStudy(row.original.id)}
                  data-testid={`delete-external-study-button`}
                  color="error"
                  variant="text"
                >
                  <DeleteIcon />
                </Button>
              ) : (
                <></>
              )}
            </div>
          ),
        },
      ] as ColumnDef<Study>[],
    [t, canEdit, deleteLinkedStudy, deleteExternalStudy],
  )

  const mergedTable = useReactTable({
    columns: mergedColumns,
    data: mergedStudies,
    getCoreRowModel: getCoreRowModel(),
  })

  return mergedStudies.length && <BaseTable table={mergedTable} testId="table-merged-studies" />
}

export default LinkedStudiesTable
