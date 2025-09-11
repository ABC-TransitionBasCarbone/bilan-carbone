import { Theme } from '@mui/material'
import { SubPost } from '@prisma/client'
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

export const getPostColor = (themeColors: Theme, post?: string, color?: string) => {
  if (color) {
    return color
  }

  if (post && isPost(post) && themeColors.custom.postColors[post]) {
    return themeColors.custom.postColors[post].light
  }

  return themeColors.palette.primary.light
}

export const getSubpostColor = (theme: Theme, subpost?: SubPost): string => {
  if (subpost && theme.custom.subPostColors[subpost]) {
    return theme.custom.subPostColors[subpost]
  }
  return theme.palette.primary.light
}

export const getTagFamilyColor = (theme: Theme, index?: number): string => {
  return theme.custom.tagFamilyColors[index ?? 0]
}

export const getParentColor = (
  type: 'post' | 'tag',
  theme: Theme,
  item: Pick<BasicTypeCharts, 'post' | 'color'>,
  index?: number,
): string => {
  if (type === 'tag') {
    return getTagFamilyColor(theme, index)
  }
  return getPostColor(theme, item.post, item.color)
}

export const getChildColor = (type: 'post' | 'tag', theme: Theme, child: Omit<BasicTypeCharts, 'children'>): string => {
  if (type === 'tag') {
    return child.color || theme.palette.primary.light
  }
  return getSubpostColor(theme, child.post as SubPost)
}

export const getPostLabel = (label?: string, post?: string, tPost?: ReturnType<typeof useTranslations>) => {
  if (label) {
    return label
  }
  if (post && tPost && isPost(post)) {
    return tPost(post)
  }
  return ''
}

export const getLabel = (
  type: 'post' | 'tag',
  item: Pick<BasicTypeCharts, 'post'> & { label?: string },
  tPost?: ReturnType<typeof useTranslations>,
): string => {
  if (type === 'tag') {
    return item.label || ''
  }
  return getPostLabel(item.label, item.post, tPost)
}
