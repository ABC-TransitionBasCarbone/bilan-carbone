'use client'

import Button from '@/components/base/Button'
import { Select } from '@/components/base/Select'
import { environmentPostMapping, Post, subPostsByPost } from '@/services/posts'
import { SubPostsCommand } from '@/services/serverFunctions/emissionFactor.command'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { getPost } from '@/utils/post'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, FormControl, FormHelperText, MenuItem, SelectChangeEvent } from '@mui/material'
import { Environment, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Control, Controller, FieldPath, Path, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import { ALL_POSTS_VALUE } from './MultiplePosts'
import styles from './Posts.module.css'
import SubPostSelector from './SubPostSelector'

interface Props<T extends SubPostsCommand> {
  post?: Post
  postOptions: Post[]
  subPosts?: SubPost[]
  form: UseFormReturn<T>
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
}: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const [selectedSubPosts, setSelectedSubPosts] = useState<SubPost[] | undefined>(initalSubPosts)
  const { environment } = useAppEnvironmentStore()

  const isAllPosts = !initialPost

  const control = form.control as Control<SubPostsCommand>
  const [post, setPost] = useState<Post | undefined>(getPost(initalSubPosts?.[0]) || initialPost)

  const setValue = form.setValue as UseFormSetValue<SubPostsCommand>

  const sortedPosts = useMemo(
    () =>
      Object.keys(environmentPostMapping[environment || Environment.BC]).sort((a, b) =>
        tPost(a).localeCompare(tPost(b)),
      ),
    [environment, tPost],
  )

  // For regular posts, show sub-posts for that specific post
  // For "All Posts", show all sub-posts grouped by their parent posts
  const sortedSubPosts = useMemo<SubPost[]>(() => {
    if (isAllPosts) {
      // Return all sub-posts from all posts
      return Object.values(environmentPostMapping[environment || Environment.BC])
        .flatMap((post: Post) => subPostsByPost[post])
        .sort((a, b) => tPost(a).localeCompare(tPost(b)))
    }
    return post ? subPostsByPost[post].sort((a, b) => tPost(a).localeCompare(tPost(b))) : []
  }, [isAllPosts, post, environment, tPost])

  const handleSelectPost = (event: SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as Post | typeof ALL_POSTS_VALUE
    setSelectedSubPosts([])

    let currentSubPosts: Record<string, SubPost[]> =
      (form.getValues('subPosts' as Path<T>) as Record<string, SubPost[]>) || {}

    // Remove the current entry (whether it's ALL_POSTS or a regular post)
    const keyToRemove = isAllPosts ? ALL_POSTS_VALUE : post
    if (keyToRemove) {
      currentSubPosts = removePostFromSubPosts(currentSubPosts, keyToRemove)
    }

    // Only add the new post if it's not empty (i.e., not cleared)
    if (selectedPost) {
      currentSubPosts = createUpdatedSubPosts(currentSubPosts, selectedPost, [])

      if (selectedPost !== ALL_POSTS_VALUE) {
        setPost(selectedPost)
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

  const handleSelectSubPost = (subPostsArr: SubPost[]) => {
    setSelectedSubPosts(subPostsArr)

    const currentSubPosts: Record<string, SubPost[]> =
      (form.getValues('subPosts' as Path<T>) as Record<string, SubPost[]>) || {}

    const key = isAllPosts ? ALL_POSTS_VALUE : post
    if (key) {
      const updatedSubPosts = createUpdatedSubPosts(currentSubPosts, key, subPostsArr)
      setValue('subPosts', updatedSubPosts)
    }
  }

  return (
    <Box className="w100 align-end justify-between">
      <FormControl className={styles.selectForm}>
        <Select
          name="post"
          labelId="post-select-label"
          value={isAllPosts ? 'ALL_POSTS' : post || ''}
          onChange={handleSelectPost}
          label={`${t('post')} *`}
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
            <SubPostSelector
              isAllPosts={isAllPosts}
              post={post}
              selectedSubPosts={selectedSubPosts}
              sortedSubPosts={sortedSubPosts}
              onSelectSubPost={handleSelectSubPost}
            />
            {error && error.message && selectedSubPosts?.length === 0 && (
              <FormHelperText className={styles.errorSubposts} color="red">
                {error.message}
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
