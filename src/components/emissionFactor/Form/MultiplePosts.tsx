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
export const ALL_POSTS_VALUE = 'ALL_POSTS'
export const ALL_SUB_POSTS_VALUE = 'ALL_SUB_POSTS'

const MultiplePosts = <T extends SubPostsCommand>({ form, context }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const tGlossary = useTranslations('emissionFactors.create.glossary')

  const control = form.control as Control<SubPostsCommand>
  const setValue = form.setValue as UseFormSetValue<SubPostsCommand>

  const [glossary, setGlossary] = useState('')

  const watchedSubPosts = form.watch('subPosts' as FieldPath<T>)
  const selectedPosts: Record<Post, SubPost[]> = useMemo(
    () => (watchedSubPosts as Record<Post, SubPost[]>) || {},
    [watchedSubPosts],
  )

  useEffect(() => {
    if (!form.formState.isSubmitted) {
      return
    }
    form.trigger('subPosts' as FieldPath<T>)
  }, [selectedPosts, form])

  const availablePosts: BCPost[] = useMemo(
    () =>
      Object.keys(BCPost)
        .sort((a, b) => tPost(a).localeCompare(tPost(b)))
        .filter((postKey) => !Object.keys(selectedPosts).includes(postKey)) as BCPost[],
    [selectedPosts, tPost],
  )

  const handleSelectPost = (event: SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as string

    const currentSubPosts = {
      ...selectedPosts,
      [selectedPost]: [],
    }

    setValue('subPosts', currentSubPosts as Record<string, SubPost[]>)
  }

  // Check if "All posts" is already selected
  const hasAllPosts = useMemo(() => Object.keys(selectedPosts).includes(ALL_POSTS_VALUE), [selectedPosts])

  return (
    <div className="flex-col">
      {Object.keys(selectedPosts).map((postKey) => (
        <Box key={postKey} className={styles.postContainer}>
          <Posts
            postOptions={postKey === ALL_POSTS_VALUE ? Object.values(BCPost) : availablePosts}
            form={form}
            post={postKey === ALL_POSTS_VALUE ? undefined : (postKey as Post)}
            subPosts={selectedPosts[postKey as Post]}
          />
        </Box>
      ))}

      {/* Only show the post selector if "All posts" is not already selected */}
      {!hasAllPosts && (
        <Controller
          name={'subPosts' as FieldPath<T>}
          control={control}
          render={({ fieldState: { error } }) => (
            <FormControl className={styles.selectForm} error={error && Object.keys(selectedPosts).length === 0}>
              <Select
                name={'post'}
                onChange={handleSelectPost}
                data-testid="emission-factor-post"
                label={t('posts')}
                fullWidth
                icon={<HelpIcon onClick={() => setGlossary(`post_${context}`)} label={tGlossary('title')} />}
                iconPosition="after"
              >
                {Object.keys(selectedPosts).length === 0 && (
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
              {error && error.message && Object.keys(selectedPosts).length === 0 && (
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
