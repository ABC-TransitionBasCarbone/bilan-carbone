'use client'

import Button from '@/components/base/Button'
import { Select } from '@/components/base/Select'
import { BCPost, Post, subPostsByPost } from '@/services/posts'
import { SubPostsCommand } from '@/services/serverFunctions/emissionFactor.command'
import { getPost } from '@/utils/post'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Checkbox,
  FormControl,
  FormHelperText,
  ListItemText,
  ListSubheader,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Control, Controller, FieldPath, Path, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import { ALL_POSTS_VALUE, ALL_SUB_POSTS_VALUE } from './MultiplePosts'
import styles from './Posts.module.css'

interface Props<T extends SubPostsCommand> {
  post?: Post
  postOptions: Post[]
  subPosts?: SubPost[]
  form: UseFormReturn<T>
  isAllPosts?: boolean
}

// Utility functions
const isAllSubPostsSelected = (selectedSubPosts: SubPost[] | undefined, allSubPosts: SubPost[]): boolean => {
  return selectedSubPosts?.length === allSubPosts.length
}

const createUpdatedSubPosts = (
  currentSubPosts: Record<string, SubPost[]>,
  key: string,
  newSubPosts: SubPost[],
): Record<string, SubPost[]> => {
  return {
    ...currentSubPosts,
    [key]: newSubPosts,
  }
}

const removePostFromSubPosts = (
  currentSubPosts: Record<string, SubPost[]>,
  keyToRemove: string,
): Record<string, SubPost[]> => {
  const updated = { ...currentSubPosts }
  delete updated[keyToRemove]
  return updated
}

const Posts = <T extends SubPostsCommand>({
  form,
  subPosts: initalSubPosts,
  post: initialPost,
  postOptions,
  isAllPosts = false,
}: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const [selectedSubPosts, setSelectedSubPosts] = useState<SubPost[] | undefined>(initalSubPosts)

  const control = form.control as Control<SubPostsCommand>
  const [post, setPost] = useState<Post | undefined>(getPost(initalSubPosts?.[0]) || initialPost)

  const setValue = form.setValue as UseFormSetValue<SubPostsCommand>

  // Get all posts sorted alphabetically
  const sortedPosts = useMemo(() => Object.keys(BCPost).sort((a, b) => tPost(a).localeCompare(tPost(b))), [tPost])

  // For regular posts, show sub-posts for that specific post
  // For "All Posts", show all sub-posts grouped by their parent posts
  const subPosts = useMemo<SubPost[]>(() => {
    if (isAllPosts) {
      // Return all sub-posts from all posts
      return Object.values(BCPost)
        .flatMap((post) => subPostsByPost[post])
        .sort((a, b) => tPost(a).localeCompare(tPost(b)))
    }
    return post ? subPostsByPost[post].sort((a, b) => tPost(a).localeCompare(tPost(b))) : []
  }, [post, tPost, isAllPosts])

  const handleSelectPost = (event: SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as string
    setSelectedSubPosts([])

    let currentSubPosts: Record<string, SubPost[]> =
      (form.getValues('subPosts' as Path<T>) as Record<string, SubPost[]>) || {}

    // Remove the current entry (whether it's ALL_POSTS or a regular post)
    const keyToRemove = isAllPosts ? ALL_POSTS_VALUE : post
    if (keyToRemove) {
      currentSubPosts = removePostFromSubPosts(currentSubPosts, keyToRemove)
    }

    // Only add the new post if it's not empty (i.e., not cleared)
    if (selectedPost && selectedPost !== '') {
      currentSubPosts = createUpdatedSubPosts(currentSubPosts, selectedPost, [])

      if (selectedPost !== ALL_POSTS_VALUE) {
        setPost(selectedPost as Post)
      }
    } else {
      // If cleared, set post to undefined which will cause this component to disappear
      setPost(undefined)
    }

    setValue('subPosts', currentSubPosts)
  }

  const handleDelete = () => {
    const currentSubPosts: Record<string, SubPost[]> =
      (form.getValues('subPosts' as Path<T>) as Record<string, SubPost[]>) || {}

    const keyToRemove = isAllPosts ? ALL_POSTS_VALUE : post
    if (keyToRemove) {
      const updatedSubPosts = removePostFromSubPosts(currentSubPosts, keyToRemove)
      setValue('subPosts', updatedSubPosts)
    }
  }

  const handleSelectSubPost = (subPostsArr: string[]) => {
    const newSubPosts = subPostsArr as SubPost[]
    setSelectedSubPosts(newSubPosts)

    const currentSubPosts: Record<string, SubPost[]> =
      (form.getValues('subPosts' as Path<T>) as Record<string, SubPost[]>) || {}

    const key = isAllPosts ? ALL_POSTS_VALUE : post
    if (key) {
      const updatedSubPosts = createUpdatedSubPosts(currentSubPosts, key, newSubPosts)
      setValue('subPosts', updatedSubPosts)
    }
  }

  const renderSubPostSelector = () => {
    const allSubPostsValues = isAllPosts
      ? Object.values(BCPost).flatMap((postKey) => subPostsByPost[postKey])
      : post
        ? subPostsByPost[post]
        : []

    const allSelected = isAllSubPostsSelected(selectedSubPosts, allSubPostsValues)
    const label = isAllPosts ? tPost('allSubPost') : t('subPost')
    const emptyText = isAllPosts ? tPost('allSubPost') : t('subPost')

    const handleSelectAllToggle = () => {
      if (allSelected) {
        handleSelectSubPost([])
      } else {
        handleSelectSubPost(allSubPostsValues)
      }
    }

    const handleChange = (event: SelectChangeEvent<unknown>) => {
      const value = event.target.value as string[]

      if (value.includes(ALL_SUB_POSTS_VALUE)) {
        handleSelectAllToggle()
      } else {
        handleSelectSubPost(value)
      }
    }

    const renderValue = () => {
      if (!selectedSubPosts || selectedSubPosts.length === 0) {
        return <em>{emptyText}</em>
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
      return Object.values(BCPost)
        .sort((a, b) => tPost(a).localeCompare(tPost(b)))
        .map((postKey) => [
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

      return [renderSelectAllMenuItem(), ...subPosts.map(renderSubPostMenuItem)]
    }

    return (
      <Select
        name="subPosts"
        data-testid="emission-factor-subPost"
        label={label}
        value={selectedSubPosts || []}
        onChange={handleChange}
        multiple
        renderValue={renderValue}
      >
        {renderMenuItems()}
      </Select>
    )
  }

  return (
    <Box className="w100 align-end justify-between">
      <FormControl className={styles.selectForm}>
        <Select
          name="post"
          labelId="post-select-label"
          value={isAllPosts ? 'ALL_POSTS' : post || ''}
          onChange={handleSelectPost}
          label={t('post')}
          t={t}
          clearable
        >
          {isAllPosts && <MenuItem value="ALL_POSTS">{tPost('allPost')}</MenuItem>}
          {sortedPosts.map((postOption) => (
            <MenuItem disabled={!postOptions.includes(postOption as Post)} key={postOption} value={postOption}>
              {tPost(postOption)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Controller
        name={'subPosts' as FieldPath<T>}
        control={control}
        render={({ fieldState: { error } }) => (
          <FormControl className={styles.multiSelectForm} error={error && selectedSubPosts?.length === 0}>
            {renderSubPostSelector()}
            {error && error.message && selectedSubPosts?.length === 0 && (
              <FormHelperText className={styles.errorSubposts} color="red">
                {t('validation.' + error.message)}
              </FormHelperText>
            )}
          </FormControl>
        )}
      />
      <Button
        className={styles.deleteButton}
        data-testid="delete-site-button"
        title={t('delete')}
        aria-label={t('delete')}
        onClick={handleDelete}
      >
        <DeleteIcon />
      </Button>
    </Box>
  )
}

export default Posts
