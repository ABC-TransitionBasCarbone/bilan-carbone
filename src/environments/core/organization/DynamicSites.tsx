'use client'

import SitesBC from '@/environments/base/organization/Sites'
import SitesClickson from '@/environments/clickson/organization/Sites'
import SitesCut from '@/environments/cut/organization/Sites'
import SitesTilt from '@/environments/tilt/organization/Sites'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { Environment, SiteCAUnit } from '@prisma/client'
import { UseFormReturn } from 'react-hook-form'
import DynamicComponent from '../utils/DynamicComponent'
import { typeDynamicComponent } from '../utils/dynamicUtils'

interface Props<T extends SitesCommand> {
  form: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  caUnit: SiteCAUnit
  environment: Environment
  disabled?: boolean
}

const DynamicSites = <T extends SitesCommand>({
  sites,
  form,
  withSelection,
  caUnit,
  environment,
  disabled = false,
}: Props<T>) => (
  <DynamicComponent
    environment={environment}
    environmentComponents={{
      [Environment.CUT]: typeDynamicComponent({
        component: SitesCut,
        props: {
          sites,
          form: form as UseFormReturn<SitesCommand>,
          withSelection,
          disabled,
        },
      }),
      [Environment.TILT]: typeDynamicComponent({
        component: SitesTilt,
        props: {
          sites,
          form: form as UseFormReturn<SitesCommand>,
          caUnit,
          withSelection,
          disabled,
        },
      }),
      [Environment.CLICKSON]: typeDynamicComponent({
        component: SitesClickson,
        props: {
          sites,
          form: form as UseFormReturn<SitesCommand>,
          withSelection,
          disabled,
        },
      }),
    }}
    defaultComponent={typeDynamicComponent({
      component: SitesBC,
      props: {
        sites,
        form: form as UseFormReturn<SitesCommand>,
        caUnit,
        withSelection,
        disabled,
      },
    })}
  />
)

export default DynamicSites
