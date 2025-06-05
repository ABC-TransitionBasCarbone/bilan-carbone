import HelpIcon from '@/components/base/HelpIcon'
import { Select } from '@/components/base/Select'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { BCPost, Post } from '@/services/posts'
import { SubPostsCommand } from '@/services/serverFunctions/emissionFactor.command'
import { Box, FormControl, FormHelperText, MenuItem, SelectChangeEvent } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Control, Controller, FieldPath, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import Posts from './Posts'
import styles from './Posts.module.css'

interface Props<T extends SubPostsCommand> {
  form: UseFormReturn<T>
  context: 'emissionFactor' | 'studyContributor'
}

// Constants
const ALL_POSTS_VALUE = 'ALL_POSTS'

// Utility functions
const hasAllPostsSelected = (posts: Record<string, SubPost[]>): boolean => {
  return Object.keys(posts).includes(ALL_POSTS_VALUE)
}

const MultiplePosts = <T extends SubPostsCommand>({ form, context }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const tGlossary = useTranslations('emissionFactors.create.glossary')

  const control = form.control as Control<SubPostsCommand>
  const setValue = form.setValue as UseFormSetValue<SubPostsCommand>

  const [glossary, setGlossary] = useState('')

  const posts: Record<Post, SubPost[]> = useMemo(
    () => (form.watch('subPosts' as FieldPath<T>) as Record<Post, SubPost[]>) || {},
    [form],
  )

  useEffect(() => {
    if (!form.formState.isSubmitted) {
      return
    }
    form.trigger('subPosts' as FieldPath<T>)
  }, [posts, form])

  // Get available posts that haven't been selected yet
  const availablePosts: BCPost[] = useMemo(
    () =>
      Object.keys(BCPost)
        .sort((a, b) => tPost(a).localeCompare(tPost(b)))
        .filter((postKey) => !Object.keys(posts).includes(postKey)) as BCPost[],
    [posts, tPost],
  )

  const handleSelectPost = (event: SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as string

    if (selectedPost === ALL_POSTS_VALUE) {
      // Add "Tous les postes" as a special post with empty sub-posts array
      const currentSubPosts = { ...posts, [ALL_POSTS_VALUE]: [] }
      setValue('subPosts', currentSubPosts as Record<string, SubPost[]>)
    } else {
      // Original behavior for regular posts
      const currentSubPosts = { ...posts, [selectedPost as Post]: [] }
      setValue('subPosts', currentSubPosts)
    }
  }

  // Check if "Tous les postes" is already selected
  const hasAllPosts = hasAllPostsSelected(posts)

  return (
    <div className="flex-col">
      {Object.keys(posts).map((postKey) => (
        <Box key={postKey} className={styles.postContainer}>
          <Posts
            postOptions={postKey === ALL_POSTS_VALUE ? Object.values(BCPost) : availablePosts}
            form={form}
            post={postKey === ALL_POSTS_VALUE ? undefined : (postKey as Post)}
            subPosts={posts[postKey as Post]}
            isAllPosts={postKey === ALL_POSTS_VALUE}
          />
        </Box>
      ))}

      {/* Only show the post selector if "Tous les postes" is not already selected */}
      {!hasAllPosts && (
        <Controller
          name={'subPosts' as FieldPath<T>}
          control={control}
          render={({ fieldState: { error } }) => (
            <FormControl className={styles.selectForm} error={error && Object.keys(posts).length === 0}>
              <Select
                name={'post'}
                onChange={handleSelectPost}
                data-testid="emission-factor-post"
                label={t('posts')}
                fullWidth
                icon={<HelpIcon onClick={() => setGlossary(`post_${context}`)} label={tGlossary('title')} />}
                iconPosition="after"
              >
                {Object.keys(posts).length === 0 && (
                  <MenuItem key={ALL_POSTS_VALUE} value={ALL_POSTS_VALUE}>
                    {tPost('allPost')}
                  </MenuItem>
                )}
                {availablePosts.map((post) => (
                  <MenuItem key={post} value={post}>
                    {tPost(post)}
                  </MenuItem>
                ))}
              </Select>
              {error && error.message && Object.keys(posts).length === 0 && (
                <FormHelperText color="red">{t('validation.' + error.message)}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      )}

      {glossary && (
        <GlossaryModal glossary="post" label="emission-factor-post" t={tGlossary} onClose={() => setGlossary('')}>
          {tGlossary(`${glossary}Description`)}
        </GlossaryModal>
      )}
    </div>
  )
}

export default MultiplePosts
