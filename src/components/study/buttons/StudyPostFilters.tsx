import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionSourcesStatus } from '@/services/study'
import { EmissionSourcesFilters } from '@/types/filters'
import { Checkbox, FormControl, ListItemText, MenuItem, Select } from '@mui/material'
import { EmissionSourceCaracterisation, EmissionSourceType } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './StudyPostFilters.module.css'

interface Props {
  study: FullStudy
  post: Post
  filters: EmissionSourcesFilters
  setFilters: (values: Partial<EmissionSourcesFilters>) => void
}

type EmissionSourcesFiltersSelects = Omit<EmissionSourcesFilters, 'search'>
type SelectKey = keyof EmissionSourcesFiltersSelects
type EmissionSourcesFiltersItem = EmissionSourcesFiltersSelects[SelectKey][number]

const StudyPostFilters = ({ study, post, filters, setFilters }: Props) => {
  const t = useTranslations('study.post')
  const tPost = useTranslations('emissionFactors.post')
  const tTag = useTranslations('study.perimeter.family')
  const tEmissionSource = useTranslations('emissionSource.type')
  const tStatus = useTranslations('emissionSource.status')
  const tCategorisations = useTranslations('categorisations')

  const subPostOptions = useMemo(() => Object.values(subPostsByPost[post]), [post])
  const areAllSubPostsSelected = useMemo(
    () => Object.keys(filters.subPosts).length === subPostOptions.length,
    [filters.subPosts, subPostOptions],
  )

  const tagsOptions = useMemo(
    () =>
      study.tagFamilies.reduce(
        (res, tagFamily) => [...res, ...tagFamily.tags.map((tag) => ({ value: tag.id, label: tag.name }))],
        [] as { value: string; label: string }[],
      ),
    [study.tagFamilies],
  )
  const areAllTagsSelected = useMemo(
    () => Object.keys(filters.tags).length === tagsOptions.length,
    [filters.tags, tagsOptions.length],
  )

  const activityDataOptions = useMemo(() => Object.values(EmissionSourceType), [])
  const areAllEmissionSourceTypeSelected = useMemo(
    () => Object.keys(filters.activityData).length === activityDataOptions.length,
    [activityDataOptions.length, filters.activityData],
  )

  const statusOptions = useMemo(() => Object.values(EmissionSourcesStatus), [])
  const areAllStatusesSelected = useMemo(
    () => Object.keys(filters.status).length === statusOptions.length,
    [filters.status, statusOptions.length],
  )

  const caracterisationOptions = useMemo(() => Object.values(EmissionSourceCaracterisation), [])
  const areAllCaracterisationsSelected = useMemo(
    () => Object.keys(filters.caracterisations).length === caracterisationOptions.length,
    [caracterisationOptions.length, filters.caracterisations],
  )

  const onMasterClick = (key: SelectKey, currentValue: boolean, options: EmissionSourcesFiltersItem[]) =>
    setFilters({ [key]: currentValue ? [] : options })

  const onItemClick = (key: SelectKey, value: EmissionSourcesFiltersItem) => {
    const currentValues = filters[key] as EmissionSourcesFiltersItem[]
    const newValue = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...filters[key], value]

    setFilters({ [key]: newValue })
  }

  return (
    <FormControl className={styles.selector}>
      <Select
        id="emissions-source-filters-selector"
        labelId="emissions-source-filters-selector"
        value={[' ']}
        renderValue={() => <div className="align-center">{t('filters')}</div>}
        multiple
      >
        {/* SubPosts */}
        <MenuItem
          key="subpost-item-all"
          onClick={() => onMasterClick('subPosts', areAllSubPostsSelected, subPostOptions)}
        >
          <Checkbox checked={areAllSubPostsSelected} />
          <ListItemText primary={tPost('allSubPost')} />
        </MenuItem>
        {subPostOptions.map((subPost) => (
          <MenuItem
            key={`subpost-${subPost}`}
            className={styles.subItem}
            onClick={() => onItemClick('subPosts', subPost)}
          >
            <Checkbox checked={filters.subPosts.includes(subPost)} />
            <ListItemText primary={tPost(subPost)} />
          </MenuItem>
        ))}
        {/* Tags */}
        <MenuItem
          key="tag-item-all"
          onClick={() =>
            onMasterClick(
              'tags',
              areAllTagsSelected,
              tagsOptions.map((tag) => tag.value),
            )
          }
        >
          <Checkbox checked={areAllTagsSelected} />
          <ListItemText primary={tTag('allTags')} />
        </MenuItem>
        {tagsOptions.map((tag) => (
          <MenuItem key={`tags-${tag.value}`} className={styles.subItem} onClick={() => onItemClick('tags', tag.value)}>
            <Checkbox checked={filters.tags.includes(tag.value)} />
            <ListItemText primary={tag.label} />
          </MenuItem>
        ))}
        {/* activityData */}
        <MenuItem
          key="activityData-item-all"
          onClick={() => onMasterClick('activityData', areAllEmissionSourceTypeSelected, activityDataOptions)}
        >
          <Checkbox checked={areAllEmissionSourceTypeSelected} />
          <ListItemText primary={tEmissionSource('all')} />
        </MenuItem>
        {activityDataOptions.map((emissionSourceType) => (
          <MenuItem
            key={`activityData-${emissionSourceType}`}
            className={styles.subItem}
            onClick={() => onItemClick('activityData', emissionSourceType)}
          >
            <Checkbox checked={filters.activityData.includes(emissionSourceType)} />
            <ListItemText primary={tEmissionSource(emissionSourceType)} />
          </MenuItem>
        ))}
        {/* status */}
        <MenuItem key="status-item-all" onClick={() => onMasterClick('status', areAllStatusesSelected, statusOptions)}>
          <Checkbox checked={areAllStatusesSelected} />
          <ListItemText primary={tStatus('all')} />
        </MenuItem>
        {statusOptions.map((status) => (
          <MenuItem key={`status-${status}`} className={styles.subItem} onClick={() => onItemClick('status', status)}>
            <Checkbox checked={filters.status.includes(status)} />
            <ListItemText primary={tStatus(status)} />
          </MenuItem>
        ))}
        {/* caracterisation */}
        <MenuItem
          key="caracterisation-item-all"
          onClick={() => onMasterClick('caracterisations', areAllCaracterisationsSelected, caracterisationOptions)}
        >
          <Checkbox checked={areAllCaracterisationsSelected} />
          <ListItemText primary={tCategorisations('all')} />
        </MenuItem>
        {caracterisationOptions.map((caracterisation) => (
          <MenuItem
            key={`caracterisation-${caracterisation}`}
            className={styles.subItem}
            onClick={() => onItemClick('caracterisations', caracterisation)}
          >
            <Checkbox checked={filters.caracterisations.includes(caracterisation)} />
            <ListItemText primary={tCategorisations(caracterisation)} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default StudyPostFilters
