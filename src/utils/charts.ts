import { Theme } from '@mui/material'
import { useTranslations } from 'next-intl'
import { formatNumber } from './number'
import { isPost } from './post'

export interface BasicTypeCharts {
  value: number
  label: string
  post?: string
  color?: string
  children: Omit<BasicTypeCharts, 'children'>[]
}

export const formatValueAndUnit = (value: number | null, unit?: string) => {
  const safeValue = value ?? 0
  const unitToDisplay = unit ?? ''
  return `${formatNumber(safeValue, 2)} ${unitToDisplay}`
}

export const getColor = (themeColors: Theme, post?: string, color?: string) => {
  if (color) {
    return color
  }

  if (post && isPost(post) && themeColors.custom.postColors[post]) {
    return themeColors.custom.postColors[post].light
  }

  return themeColors.palette.primary.light
}

export const getLabel = (label?: string, post?: string, tPost?: ReturnType<typeof useTranslations>) => {
  let formattedLabel = ''
  if (label) {
    formattedLabel = label
  } else if (post && tPost && isPost(post)) {
    formattedLabel = tPost(post)
  }

  return formattedLabel
}
