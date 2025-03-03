import { Post, PostObject } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { useEffect, useMemo, useState } from 'react'
import { Control, Controller, Field, FieldPath, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import Posts from './Posts'
import { Select } from '@/components/base/Select'
import { useTranslations } from 'next-intl'
import { Box, FormControl, FormHelperText, MenuItem, SelectChangeEvent } from '@mui/material'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
  control: Control<T>
}

const MultiplePosts = <T extends EmissionFactorCommand>({ form, control }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const [posts, setPosts] = useState<PostObject>({})
  const postSelection = useMemo(() => Object.keys(Post).sort((a, b) => tPost(a).localeCompare(tPost(b))), [tPost])
  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>


  useEffect(() => {
   const postObj = (form.getValues("subPosts") as PostObject) || {}
    console.log("tmpPosts",  Object.keys(postObj));
    setPosts(postObj)
  }, [])

  const addPost = () => {
  }

  const handleSelectPost = (event : SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as Post
    const currentSubPosts = {...posts, [selectedPost] : []}
    setPosts(currentSubPosts)
    setValue('subPosts', currentSubPosts)
  };

  const handleChange = (posts : PostObject) => {
    setPosts(posts)
  };

  return (
    <div>
      {/* <button type="button" onClick={addPost}>
        Add Post
      </button> */}

    <Controller
      name={"subPosts" as FieldPath<T>}
      control={control}
      render={({ fieldState: { error } }) => (
        <FormControl error={!!error} fullWidth className="inputContainer">

      {Object.keys(posts).map((postKey) => (
        <Box key={postKey} sx={{mb: 2}}>
          <Posts onChange={handleChange} form={form} post={postKey as Post} subPosts={posts[postKey as Post]} />
        </Box>
      ))}
      <FormControl sx={{width: '50%'}}>
      <Select
          name="subPosts"
          data-testid="emission-factor-post"
          labelId="post-select-label"
          value={''}
          onChange={handleSelectPost}
          label={t('post')}
          // icon={<HelpIcon onClick={() => setGlossary('post')} label={tGlossary('title')} />}
          iconPosition="after"
        >
          {postSelection.map((post) => (
            <MenuItem key={post} value={post}>
              {tPost(post)}
            </MenuItem>
          ))}
        </Select>
        </FormControl>

          {error && error.message && <FormHelperText>{t('validation.' + error.message)}</FormHelperText>}
        </FormControl>
        )}
      />
    </div>
  )
}

export default MultiplePosts
