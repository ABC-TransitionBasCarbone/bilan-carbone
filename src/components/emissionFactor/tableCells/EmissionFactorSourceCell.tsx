/* eslint-disable @next/next/no-img-element */
import { canEditEmissionFactor } from '@/services/permissions/emissionFactor'
import DeleteIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import { Button as MuiButton } from '@mui/material'
import { Import } from '@prisma/client'
import { Getter } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import styles from '../EmissionFactorsTable.module.css'

interface Props {
  fromModal: boolean
  isFromRightOrga: boolean
  efId: string
  getValue: Getter<string>
  setTargetedEmission: (emissionFactorId: string) => void
  setAction: (action: 'edit' | 'delete' | undefined) => void
  hasActiveLicence: boolean
}
export const EmissionFactorSourceCell = ({
  fromModal,
  isFromRightOrga,
  efId,
  getValue,
  setTargetedEmission,
  setAction,
  hasActiveLicence,
}: Props) => {
  const t = useTranslations('emissionFactors.table')

  const importedFrom = useMemo(() => getValue<Import>(), [getValue])
  const canEdit = useMemo(
    () => hasActiveLicence && !fromModal && isFromRightOrga,
    [fromModal, hasActiveLicence, isFromRightOrga],
  )

  const editEmissionFactor = useCallback(
    async (emissionFactorId: string, action: 'edit' | 'delete') => {
      if (!canEdit || !(await canEditEmissionFactor(emissionFactorId))) {
        return
      }
      setTargetedEmission(emissionFactorId)
      setAction(action)
    },
    [canEdit, setAction, setTargetedEmission],
  )

  switch (importedFrom) {
    case Import.BaseEmpreinte:
      return (
        <div className="flex-cc">
          <img
            className={styles.importFrom}
            src="https://base-empreinte.ademe.fr/assets/img/base-empreinte.svg"
            alt="Base empreinte"
            title={t('importedFrom.baseEmpreinte')}
          />
        </div>
      )
    case Import.Legifrance:
      return (
        <div className="flex-cc">
          <img
            className={styles.importFrom}
            src="https://www.legifrance.gouv.fr/contenu/logo"
            alt="Legifrance"
            title={t('importedFrom.legifrance')}
          />
        </div>
      )
    case Import.NegaOctet:
      return (
        <div className="flex-cc">
          <img
            className={styles.importFrom}
            src="/logos/negaOctet.png"
            title={t('importedFrom.negaOctet')}
            alt="Negaoctet"
          />
        </div>
      )
    default:
      return (
        <span className={classNames(styles.importFrom, 'flex-cc')}>
          <HomeWorkIcon />
          {t('Manual')}
          {canEdit && (
            <>
              <MuiButton
                aria-label={t('edit')}
                title={t('edit')}
                className={styles.editButton}
                onClick={(e) => {
                  e.stopPropagation()
                  editEmissionFactor(efId, 'edit')
                }}
                data-testid={`edit-emission-factor-button`}
              >
                <EditIcon />
              </MuiButton>
              <MuiButton
                aria-label={t('delete')}
                title={t('delete')}
                className={styles.editButton}
                onClick={(e) => {
                  e.stopPropagation()
                  editEmissionFactor(efId, 'delete')
                }}
                data-testid={`delete-emission-factor-button`}
                color="error"
                variant="text"
              >
                <DeleteIcon />
              </MuiButton>
            </>
          )}
        </span>
      )
  }
}
