import { Select } from '@/components/base/Select'
import { Post, PostObject } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { Box, FormControl, FormHelperText, MenuItem, SelectChangeEvent } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Control, Controller, FieldPath, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import Posts from './Posts'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
  control: Control<T>
}

const MultiplePosts = <T extends EmissionFactorCommand>({ form, control }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const [posts, setPosts] = useState<PostObject>({})
  {
    /* check if post is in the list already to avoid issues */
  }
  const postSelection: Post[] = useMemo(
    () =>
      Object.keys(Post)
        .sort((a, b) => tPost(a).localeCompare(tPost(b)))
        .filter((p) => !Object.keys(posts).includes(p)) as Post[],
    [tPost, posts],
  )

  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>

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
        <Select name={'post'} onChange={handleSelectPost} label={t('post')} fullWidth>
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
    </div>
  )
}

export default MultiplePosts
