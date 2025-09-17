import { Theme } from '@mui/material'
import { StudyResultUnit, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { formatNumber } from './number'
import { isPost } from './post'
import { STUDY_UNIT_VALUES } from './study'

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

export interface ProcessedChartData {
  label: string
  value: number
  color: string
}

export interface ChartDataRings {
  innerRingData: ProcessedChartData[]
  outerRingData: ProcessedChartData[]
}

export interface BarChartData {
  labels: string[]
  values: number[]
  colors: string[]
}

export interface BarChartSeriesData {
  label: string
  data: number[]
  color: string
  stack: string
}

export interface ProcessedBarChartData {
  barData: BarChartData
  seriesData: BarChartSeriesData[]
}

export const processPieChartData = <T extends BasicTypeCharts>(
  results: T[],
  type: 'post' | 'tag',
  showSubLevel: boolean,
  theme: Theme,
  resultsUnit: StudyResultUnit,
): ChartDataRings => {
  const formatData = (
    item: Omit<BasicTypeCharts, 'children'>,
    isParent: boolean,
    index?: number,
  ): ProcessedChartData => {
    const convertedValue = item.value / STUDY_UNIT_VALUES[resultsUnit]

    return {
      label: item.label,
      value: convertedValue,
      color: isParent ? getParentColor(type, theme, item, index) : getChildColor(type, theme, item),
    }
  }

  const childrenData = results
    .flatMap((result) => result.children)
    .map((child) => formatData(child, false))
    .filter((computeResult) => computeResult.value > 0)

  if (type === 'tag' && !showSubLevel) {
    return { innerRingData: childrenData, outerRingData: [] }
  }

  const filteredResults = results.filter((result) => result.post !== 'total' && result.label !== 'total')
  const innerData = filteredResults
    .map((result, index) => formatData(result, true, index))
    .filter((computeResult) => computeResult.value > 0)

  if (!showSubLevel) {
    return { innerRingData: innerData, outerRingData: [] }
  }

  return { innerRingData: innerData, outerRingData: childrenData }
}

export const processBarChartData = <T extends BasicTypeCharts>(
  results: T[],
  type: 'post' | 'tag',
  showSubLevel: boolean,
  theme: Theme,
  resultsUnit: StudyResultUnit,
  tPost?: ReturnType<typeof useTranslations>,
): ProcessedBarChartData => {
  const filteredData = results.filter((result) => result.post !== 'total' && result.label !== 'total')
  const isTag = type === 'tag'

  if (!showSubLevel) {
    const data = isTag ? filteredData.flatMap((result) => result.children) : filteredData
    return {
      barData: {
        labels: data.map((item) => getLabel(type, item, tPost)),
        values: data.map(({ value }) => value / STUDY_UNIT_VALUES[resultsUnit]),
        colors: data.map((item, index) =>
          isTag ? getChildColor(type, theme, item) : getParentColor(type, theme, item, index),
        ),
      },
      seriesData: [],
    }
  }

  const parentLabels = filteredData.map((item) => getLabel(type, item, tPost))

  const seriesData = filteredData.reduce((acc, parent, parentIndex) => {
    parent.children.forEach((child) => {
      if (child.value > 0) {
        const existingSeries = acc.find((series) => series.label === child.label)
        const value = child.value / STUDY_UNIT_VALUES[resultsUnit]

        if (existingSeries) {
          existingSeries.data[parentIndex] = value
        } else {
          const data = new Array(filteredData.length).fill(0)
          data[parentIndex] = value
          acc.push({
            label: child.label,
            data,
            color: getChildColor(type, theme, child),
            stack: 'sublevel',
          })
        }
      }
    })
    return acc
  }, [] as BarChartSeriesData[])

  return {
    barData: { labels: parentLabels, values: [], colors: [] },
    seriesData,
  }
}
