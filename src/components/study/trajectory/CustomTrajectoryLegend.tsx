'use client'

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Badge, Checkbox, FormControlLabel, Menu, SvgIcon, Typography } from '@mui/material'
import classNames from 'classnames'
import { useState } from 'react'
import styles from './CustomTrajectoryLegend.module.css'

export interface LegendSeries {
  label: string
  color: string
  dataType?: string
  withinThreshold?: boolean
}

interface Props {
  series: LegendSeries[]
  hiddenLabels: string[]
  onToggle: (label: string) => void
  previousLabel: (year: number) => string
  currentLabel: (year: number) => string
}

interface TrajectoryGroup {
  name: string
  color: string
  previous?: LegendSeries
  current?: LegendSeries
  withinThreshold?: boolean
}

const extractYear = (label: string): number | null => {
  const match = label.match(/\((\d{4})\)$/)
  return match ? parseInt(match[1], 10) : null
}

const stripYear = (label: string): string => label.replace(/\s*\(\d{4}\)$/, '')

const CustomTrajectoryLegend = ({ series, hiddenLabels, onToggle, previousLabel, currentLabel }: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

  if (series.length === 0) {
    return null
  }

  const groupMap = new Map<string, TrajectoryGroup>()
  const groupsWithThreshold = new Set<string>()

  for (const s of series) {
    const name = stripYear(s.label)
    if (s.dataType === 'previous' && s.withinThreshold) {
      groupsWithThreshold.add(name)
    }
  }

  for (const s of series) {
    const name = stripYear(s.label)
    if (!groupMap.has(name)) {
      groupMap.set(name, { name, color: s.color })
    }
    const group = groupMap.get(name)!
    if (s.dataType === 'previous') {
      group.previous = s
      if (s.withinThreshold) {
        group.withinThreshold = true
      }
    } else if (!groupsWithThreshold.has(name)) {
      group.current = s
      group.color = s.color
    }
  }

  const groups = Array.from(groupMap.values())
  const displayedCount = series.length - hiddenLabels.length

  const getGroupLabels = (group: TrajectoryGroup) =>
    [group.previous?.label, group.current?.label].filter(Boolean) as string[]

  const isGroupAllVisible = (group: TrajectoryGroup) =>
    getGroupLabels(group).every((label) => !hiddenLabels.includes(label))

  const isGroupPartiallyVisible = (group: TrajectoryGroup) => {
    const labels = getGroupLabels(group)
    const visibleCount = labels.filter((label) => !hiddenLabels.includes(label)).length
    return visibleCount > 0 && visibleCount < labels.length
  }

  const handleToggleGroup = (group: TrajectoryGroup) => {
    const labels = getGroupLabels(group)
    const allVisible = isGroupAllVisible(group)
    labels.forEach((label) => {
      const isHidden = hiddenLabels.includes(label)
      if (allVisible && !isHidden) {
        onToggle(label)
      } else if (!allVisible && isHidden) {
        onToggle(label)
      }
    })
  }

  return (
    <>
      <Badge color="primary" invisible={displayedCount === series.length}>
        <div onClick={(e) => setAnchorEl(e.currentTarget)} className="pointer ml-2">
          <SettingsOutlinedIcon className="flex-end" color="primary" />
        </div>
      </Badge>

      <Menu
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <div className={classNames('flex-col gapped025 pr1', styles.menu)}>
          {groups.map((group) => (
            <div key={group.name} className="flex-col gapped025">
              <FormControlLabel
                className="m0"
                control={
                  <Checkbox
                    size="small"
                    checked={isGroupAllVisible(group)}
                    indeterminate={isGroupPartiallyVisible(group)}
                    onChange={() => handleToggleGroup(group)}
                  />
                }
                label={
                  <div className={classNames('flex align-center gapped025')}>
                    <SvgIcon className={styles.chartLegendIcon} fontSize="small">
                      <circle cx="12" cy="12" r="6" fill={group.color} />
                    </SvgIcon>
                    <Typography variant="body2" fontWeight={600}>
                      {group.name}
                    </Typography>
                  </div>
                }
              />
              {group.previous && group.current && (
                <div className="flex-col pl2">
                  {(() => {
                    const year = extractYear(group.previous.label)
                    return (
                      <FormControlLabel
                        className="m0"
                        control={
                          <Checkbox
                            size="small"
                            checked={!hiddenLabels.includes(group.previous.label)}
                            onChange={() => onToggle(group.previous!.label)}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {year !== null ? previousLabel(year) : group.previous.label}
                          </Typography>
                        }
                      />
                    )
                  })()}
                  {(() => {
                    const year = extractYear(group.current.label)
                    return (
                      <FormControlLabel
                        className="m0"
                        control={
                          <Checkbox
                            size="small"
                            checked={!hiddenLabels.includes(group.current.label)}
                            onChange={() => onToggle(group.current!.label)}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {year !== null ? currentLabel(year) : group.current.label}
                          </Typography>
                        }
                      />
                    )
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </Menu>
    </>
  )
}

export default CustomTrajectoryLegend
