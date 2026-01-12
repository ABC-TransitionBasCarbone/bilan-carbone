import { Post, subPostsByPost } from '@/services/posts'
import { Checkbox, FormControl, FormLabel, InputLabel, ListItemText, MenuItem, Select } from '@mui/material'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './PostSubPostFilter.module.css'

interface PostSubPostFilterProps {
  envPosts: Post[]
  envSubPosts: SubPost[]
  selectedSubPosts: SubPost[]
  onChange: (subPosts: SubPost[]) => void
  showSeparateLabel?: boolean
  className?: string
}

export const PostSubPostFilter = ({
  envPosts,
  envSubPosts,
  selectedSubPosts,
  onChange,
  showSeparateLabel = false,
  className,
}: PostSubPostFilterProps) => {
  const tCommon = useTranslations('common')
  const tPosts = useTranslations('emissionFactors.post')
  const label = tCommon('subPosts')

  const allSelectedSubPosts = useMemo(
    () => selectedSubPosts.length === envSubPosts.length,
    [selectedSubPosts, envSubPosts],
  )

  const subPostsSelectorRenderValue = () => {
    if (allSelectedSubPosts) {
      return tCommon('all')
    }
    if (selectedSubPosts.length === 0) {
      return tCommon('none')
    }
    return selectedSubPosts.map((subPost) => tPosts(subPost)).join(', ')
  }

  const areAllSelected = (post: Post) => !subPostsByPost[post].some((subPost) => !selectedSubPosts.includes(subPost))

  const selectAllSubPosts = () => {
    onChange(allSelectedSubPosts ? [] : envSubPosts)
  }

  const selectPost = (post: Post) => {
    const newValue = areAllSelected(post)
      ? selectedSubPosts.filter((filteredSubPost) => !subPostsByPost[post].includes(filteredSubPost))
      : selectedSubPosts.concat(subPostsByPost[post].filter((a) => !selectedSubPosts.includes(a)))
    onChange(newValue)
  }

  const selectSubPost = (subPost: SubPost) => {
    const newValue = selectedSubPosts.includes(subPost)
      ? selectedSubPosts.filter((filteredSubPost) => filteredSubPost !== subPost)
      : selectedSubPosts.concat([subPost])
    onChange(newValue)
  }

  return (
    <FormControl className={classNames(styles.formControl, className)}>
      {showSeparateLabel && (
        <FormLabel id={'subposts-selector-label'} component="legend">
          {label}
        </FormLabel>
      )}
      {!showSeparateLabel && (
        <InputLabel id={'subposts-selector-label'} shrink={true}>
          {label}
        </InputLabel>
      )}
      <Select
        id={'subposts-selector'}
        labelId={'subposts-selector-label'}
        value={selectedSubPosts}
        className={styles.select}
        displayEmpty
        renderValue={() => {
          const displayValue = subPostsSelectorRenderValue()
          return (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {displayValue}
            </span>
          )
        }}
        label={!showSeparateLabel ? label : undefined}
        multiple
      >
        <MenuItem key="subpost-item-all" selected={allSelectedSubPosts} onClick={selectAllSubPosts}>
          <Checkbox checked={allSelectedSubPosts} />
          <ListItemText primary={tCommon(allSelectedSubPosts ? 'action.unselectAll' : 'action.selectAll')} />
        </MenuItem>
        {Object.values(envPosts).map((post) => (
          <div key={`subpostGroup-${post}`}>
            <MenuItem key={`subpost-${post}`} selected={areAllSelected(post)} onClick={() => selectPost(post)}>
              <Checkbox checked={areAllSelected(post)} />
              <ListItemText primary={tPosts(post)} />
            </MenuItem>
            {subPostsByPost[post].map((subPost) => (
              <MenuItem
                key={`subpost-${subPost}`}
                className={'pl2'}
                selected={selectedSubPosts.includes(subPost)}
                onClick={() => selectSubPost(subPost)}
              >
                <Checkbox checked={selectedSubPosts.includes(subPost)} />
                <ListItemText primary={tPosts(subPost)} />
              </MenuItem>
            ))}
          </div>
        ))}
      </Select>
    </FormControl>
  )
}
