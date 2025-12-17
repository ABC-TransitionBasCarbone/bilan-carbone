'use client'

import { Select } from '@/components/base/Select'
import { environmentPostMapping, Post, subPostsByPost } from '@/services/posts'
import { Checkbox, ListItemText, ListSubheader, MenuItem, SelectChangeEvent } from '@mui/material'
import { Environment, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { ALL_SUB_POSTS_VALUE } from './MultiplePosts'

interface Props {
  isAllPosts: boolean
  post?: Post
  selectedSubPosts?: SubPost[]
  sortedSubPosts: SubPost[]
  onSelectSubPost: (subPosts: SubPost[]) => void
  environment?: Environment
}

type SubPostValue = SubPost | typeof ALL_SUB_POSTS_VALUE

const isAllSubPostsSelected = (selectedSubPosts: SubPost[] | undefined, allSubPosts: SubPost[]): boolean => {
  return selectedSubPosts?.length === allSubPosts.length
}

const SubPostSelector = ({
  isAllPosts,
  post,
  selectedSubPosts,
  sortedSubPosts,
  onSelectSubPost,
  environment = Environment.BC,
}: Props) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')

  const allSubPostsValues = isAllPosts
    ? Object.values(Object.values(environmentPostMapping[environment])).flatMap(
        (postKey: Post) => subPostsByPost[postKey],
      )
    : post
      ? subPostsByPost[post]
      : []

  const allSelected = isAllSubPostsSelected(selectedSubPosts, allSubPostsValues)

  const handleSelectAllToggle = () => {
    if (allSelected) {
      onSelectSubPost([])
    } else {
      onSelectSubPost(allSubPostsValues)
    }
  }

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as SubPostValue[]

    if (value.includes(ALL_SUB_POSTS_VALUE)) {
      handleSelectAllToggle()
    } else {
      onSelectSubPost(value as SubPost[])
    }
  }

  const renderValue = () => {
    if (!selectedSubPosts || selectedSubPosts.length === 0) {
      return ''
    }
    if (allSelected) {
      return tPost('allSubPost')
    }
    return selectedSubPosts.map((subPost) => tPost(subPost)).join(', ')
  }

  const renderSelectAllMenuItem = () => (
    <MenuItem key={ALL_SUB_POSTS_VALUE} value={ALL_SUB_POSTS_VALUE}>
      <Checkbox checked={allSelected} />
      <ListItemText primary={tPost('allSubPost')} />
    </MenuItem>
  )

  const renderSubPostMenuItem = (subPost: SubPost) => (
    <MenuItem key={subPost} value={subPost}>
      <Checkbox checked={selectedSubPosts?.includes(subPost) || false} />
      <ListItemText primary={tPost(subPost)} />
    </MenuItem>
  )

  const renderGroupedMenuItems = () => {
    return Object.values(Object.values(environmentPostMapping[environment]))
      .sort((a, b) => tPost(a).localeCompare(tPost(b)))
      .map((postKey: Post) => [
        <ListSubheader key={`header-${postKey}`} disableSticky>
          {tPost(postKey)}
        </ListSubheader>,
        ...subPostsByPost[postKey].sort((a, b) => tPost(a).localeCompare(tPost(b))).map(renderSubPostMenuItem),
      ])
      .flat()
  }

  const renderMenuItems = () => {
    if (isAllPosts) {
      return [renderSelectAllMenuItem(), ...renderGroupedMenuItems()]
    }

    return [renderSelectAllMenuItem(), ...sortedSubPosts.map(renderSubPostMenuItem)]
  }

  return (
    <Select
      name="subPosts"
      data-testid="emission-factor-subPost"
      label={`${t('subPost')} *`}
      value={selectedSubPosts || []}
      onChange={handleChange}
      multiple
      renderValue={renderValue}
    >
      {renderMenuItems()}
    </Select>
  )
}

export default SubPostSelector
