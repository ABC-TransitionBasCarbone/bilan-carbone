'use client'

import Button from '@/components/base/Button'
import { MultiSelect } from '@/components/base/MultiSelect'
import { Select } from '@/components/base/Select'
import { BCPost, Post, subPostsByPost } from '@/services/posts'
import { SubPostsCommand } from '@/services/serverFunctions/emissionFactor.command'
import { getPost } from '@/utils/post'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, FormControl, FormHelperText, MenuItem, SelectChangeEvent } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Control, Controller, FieldPath, Path, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import styles from './Posts.module.css'

interface Props<T extends SubPostsCommand> {
  post?: Post
  postOptions: Post[]
  subPosts?: SubPost[]
  form: UseFormReturn<T>
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

  const control = form.control as Control<SubPostsCommand>
  const [post, setPost] = useState<Post | undefined>(getPost(initalSubPosts?.[0]) || initialPost)

  const setValue = form.setValue as UseFormSetValue<SubPostsCommand>

  const posts = useMemo(() => Object.keys(BCPost).sort((a, b) => tPost(a).localeCompare(tPost(b))), [tPost])
  const subPosts = useMemo<SubPost[]>(
    () => (post ? subPostsByPost[post].sort((a, b) => tPost(a).localeCompare(tPost(b))) : []),
    [post, tPost],
  )

  const translatedSubPosts = useMemo(
    () => subPosts.map((subPost) => ({ label: tPost(subPost), value: subPost })),
    [subPosts],
  )

  const handleSelectPost = (event: SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as Post
    setSelectedSubPosts([])
    const currentSubPosts: Record<Post, SubPost[]> =
      (form.getValues('subPosts' as Path<T>) as Record<Post, SubPost[]>) || {}
    if (post) {
      delete currentSubPosts[post]
    }
    currentSubPosts[selectedPost] = []
    setValue('subPosts', currentSubPosts)

    setPost(selectedPost)
  }

  const handleDelete = () => {
    if (!post) {
      return
    }
    const currentSubPosts: Record<Post, SubPost[]> =
      (form.getValues('subPosts' as Path<T>) as Record<Post, SubPost[]>) || {}
    delete currentSubPosts[post]
    setValue('subPosts', currentSubPosts)
  }

  const handleSelectSubPost = (subPostsArr: string[]) => {
    if (!post) {
      return
    }
    setSelectedSubPosts(subPostsArr as SubPost[])
    const currentSubPosts: Record<Post, SubPost[]> =
      (form.getValues('subPosts' as Path<T>) as Record<Post, SubPost[]>) || {}
    const newSubPosts = { ...currentSubPosts, [post]: subPostsArr }
    setValue('subPosts', newSubPosts)
  }

  return (
    <Box className="w100 align-end justify-between">
      <FormControl className={styles.selectForm}>
        <Select
          name="post"
          labelId="post-select-label"
          value={post || ''}
          onChange={handleSelectPost}
          label={t('post')}
          t={t}
          clearable
        >
          {posts.map((post) => (
            <MenuItem disabled={!postOptions.includes(post as Post)} key={post} value={post}>
              {tPost(post)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Controller
        name={'subPosts' as FieldPath<T>}
        control={control}
        render={({ fieldState: { error } }) => (
          <FormControl className={styles.multiSelectForm} error={error && selectedSubPosts?.length === 0}>
            <MultiSelect
              name="subPosts"
              data-testid="emission-factor-subPost"
              labelId="subpost-select-label"
              value={selectedSubPosts || []}
              onChange={handleSelectSubPost}
              label={t('subPost')}
              options={translatedSubPosts}
              translation={tPost}
            />
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
