import HelpIcon from '@/components/base/HelpIcon'
import { Select } from '@/components/base/Select'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { Post, PostObject } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { Box, FormControl, FormHelperText, MenuItem, SelectChangeEvent } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Control, Controller, FieldPath, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import Posts from './Posts'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
}

const MultiplePosts = <T extends EmissionFactorCommand>({ form }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const tGlossary = useTranslations('emissionFactors.create.glossary')

  const control = form.control as Control<EmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>

  const [posts, setPosts] = useState<PostObject>({})
  const [glossary, setGlossary] = useState('')

  // check if post is in the list already to avoid issues
  const postSelection: Post[] = useMemo(
    () =>
      Object.keys(Post)
        .sort((a, b) => tPost(a).localeCompare(tPost(b)))
        .filter((p) => !Object.keys(posts).includes(p)) as Post[],
    [tPost, posts],
  )

  useEffect(() => {
    const postObj = (form.getValues('subPosts' as FieldPath<T>) as PostObject) || {}
    setPosts(postObj)
  }, [form])

  const handleSelectPost = (event: SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as Post
    const currentSubPosts = { ...posts, [selectedPost]: [] }
    setPosts(currentSubPosts)
    setValue('subPosts', currentSubPosts)
  }

  const handleChange = (posts: PostObject) => {
    setPosts(posts)
  }

  return (
    <div className="flex-col">
      {/* Real posts/Subpost selection */}
      {Object.keys(posts).map((postKey) => (
        <Box key={postKey} sx={{ mb: 2 }}>
          <Posts
            postOptions={postSelection}
            onChange={handleChange}
            form={form}
            post={postKey as Post}
            subPosts={posts[postKey as Post]}
          />
        </Box>
      ))}

      {/* Adding post logic from a select */}
      <FormControl sx={{ width: '40%' }} error={Object.keys(posts).length === 0}>
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

      {/* display error message */}
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
