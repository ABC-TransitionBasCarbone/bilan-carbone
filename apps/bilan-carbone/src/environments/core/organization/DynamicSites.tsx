'use client'

import SitesBC from '@/environments/base/organization/Sites'
import SitesClickson from '@/environments/clickson/organization/Sites'
import SitesCut from '@/environments/cut/organization/Sites'
import SitesTilt from '@/environments/tilt/organization/Sites'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { Environment, SiteCAUnit } from '@repo/db-common/enums'
import { UseFormReturn } from 'react-hook-form'
import DynamicComponent from '../utils/DynamicComponent'

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
