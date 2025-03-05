import HelpIcon from '@/components/base/HelpIcon'
import { Select } from '@/components/base/Select'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { Post } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { Box, FormControl, FormHelperText, MenuItem, SelectChangeEvent } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Control, Controller, FieldPath, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import Posts from './Posts'
import styles from './Posts.module.css'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
}

const MultiplePosts = <T extends EmissionFactorCommand>({ form }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const tGlossary = useTranslations('emissionFactors.create.glossary')

  const control = form.control as Control<EmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>

  const posts: Record<Post, SubPost[]> = (form.watch('subPosts' as FieldPath<T>) as Record<Post, SubPost[]>) || {}
  const [glossary, setGlossary] = useState('')

  const postSelection: Post[] = useMemo(
    () =>
      Object.keys(Post)
        .sort((a, b) => tPost(a).localeCompare(tPost(b)))
        .filter((p) => !Object.keys(posts).includes(p)) as Post[],
    [posts],
  )

  const handleSelectPost = (event: SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as Post
    const currentSubPosts = { ...posts, [selectedPost]: [] }
    setValue('subPosts', currentSubPosts)
  }

  return (
    <div className="flex-col">
      {Object.keys(posts).map((postKey) => (
        <Box key={postKey} className={styles.postContainer}>
          <Posts postOptions={postSelection} form={form} post={postKey as Post} subPosts={posts[postKey as Post]} />
        </Box>
      ))}

      <FormControl className={styles.selectForm} error={Object.keys(posts).length === 0}>
        <Select
          name={'post'}
          onChange={handleSelectPost}
          data-testid="emission-factor-post"
          label={t('posts')}
          fullWidth
          icon={<HelpIcon onClick={() => setGlossary('post')} label={tGlossary('title')} />}
          iconPosition="after"
        >
          {postSelection.map((post) => (
            <MenuItem key={post} value={post}>
              {tPost(post)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Controller
        name={'subPosts' as FieldPath<T>}
        control={control}
        render={({ fieldState: { error } }) => (
          <FormControl error={!!error}>
            {error && error.message && <FormHelperText color="red">{t('validation.' + error.message)}</FormHelperText>}
          </FormControl>
        )}
      />

      {glossary && (
        <GlossaryModal glossary={glossary} label="emission-factor-post" t={tGlossary} onClose={() => setGlossary('')}>
          {tGlossary(`${glossary}Description`)}
        </GlossaryModal>
      )}
    </div>
  )
}

export default MultiplePosts
