'use client'

import { SitesCommand } from '@/services/serverFunctions/study.command'
import { Environment, SiteCAUnit } from '@prisma/client'
import dynamic from 'next/dynamic'
import { UseFormReturn } from 'react-hook-form'
import DynamicComponent from '../utils/DynamicComponent'

const SitesCut = dynamic(() => import('@/environments/cut/organization/Sites'))
const SitesTilt = dynamic(() => import('@/environments/tilt/organization/Sites'))
const SitesClickson = dynamic(() => import('@/environments/clickson/organization/Sites'))
const SitesBC = dynamic(() => import('@/environments/base/organization/Sites'))

interface Props<T extends SitesCommand> {
  form: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  caUnit: SiteCAUnit
  disabled?: boolean
}

const DynamicSites = <T extends SitesCommand>({ sites, form, withSelection, caUnit, disabled = false }: Props<T>) => (
  <DynamicComponent
    environmentComponents={{
      [Environment.CUT]: (
        <SitesCut
          sites={sites}
          form={form as UseFormReturn<SitesCommand>}
          withSelection={withSelection}
          disabled={disabled}
        />
      ),
      [Environment.TILT]: (
        <SitesTilt sites={sites} form={form} caUnit={caUnit} withSelection={withSelection} disabled={disabled} />
      ),
      [Environment.CLICKSON]: (
        <SitesClickson sites={sites} form={form} withSelection={withSelection} disabled={disabled} />
      ),
    }}
    defaultComponent={
      <SitesBC sites={sites} form={form} caUnit={caUnit} withSelection={withSelection} disabled={disabled} />
    }
  />
)

export default DynamicSites
