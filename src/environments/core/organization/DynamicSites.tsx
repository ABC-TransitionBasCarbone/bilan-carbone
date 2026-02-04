'use client'

import { SitesCommand } from '@/services/serverFunctions/study.command'
import { Environment, SiteCAUnit } from '@prisma/client'
import dynamic from 'next/dynamic'
import { UseFormReturn } from 'react-hook-form'
import DynamicComponent from '../utils/DynamicComponent'
import { typeDynamicComponent } from '../utils/dynamicUtils'

const SitesCut = dynamic(() => import('@/environments/cut/organization/Sites'))
const SitesTilt = dynamic(() => import('@/environments/tilt/organization/Sites'))
const SitesClickson = dynamic(() => import('@/environments/clickson/organization/Sites'))
const SitesBC = dynamic(() => import('@/environments/base/organization/Sites'))

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
