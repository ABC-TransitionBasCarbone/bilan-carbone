'use client'

import SitesBC from '@/environments/base/organization/Sites'
import SitesCut from '@/environments/cut/organization/Sites'
import SitesTilt from '@/environments/tilt/organization/Sites'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { Environment, SiteCAUnit } from '@prisma/client'
import { UseFormReturn } from 'react-hook-form'
import DynamicComponent from '../utils/DynamicComponent'

interface Props<T extends SitesCommand> {
  form: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  caUnit: SiteCAUnit
}

const DynamicSites = <T extends SitesCommand>({ sites, form, withSelection, caUnit }: Props<T>) => (
  <DynamicComponent
    environmentComponents={{
      [Environment.CUT]: (
        <SitesCut sites={sites} form={form as UseFormReturn<SitesCommand>} withSelection={withSelection} />
      ),
      [Environment.TILT]: <SitesTilt sites={sites} form={form} caUnit={caUnit} withSelection={withSelection} />,
    }}
    defaultComponent={<SitesBC sites={sites} form={form} caUnit={caUnit} withSelection={withSelection} />}
  />
)

export default DynamicSites
