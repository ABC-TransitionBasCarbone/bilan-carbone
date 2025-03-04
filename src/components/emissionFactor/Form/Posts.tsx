'use client'

import Button from '@/components/base/Button'
import { MultiSelect } from '@/components/base/MultiSelect'
import { Select } from '@/components/base/Select'
import { Post, PostObject, subPostsByPost } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { getPost } from '@/utils/post'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, FormControl, MenuItem, SelectChangeEvent } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Path, UseFormReturn, UseFormSetValue } from 'react-hook-form'

interface Props<T extends EmissionFactorCommand> {
  post?: Post
  postOptions: Post[]
  subPosts?: SubPost[]
  form: UseFormReturn<T>
  onChange: (updatedPosts: PostObject) => void
}

const Posts = <T extends EmissionFactorCommand>({
  form,
  subPosts: initalSubPosts,
  post: initialPost,
  postOptions,
  onChange,
}: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const [selectedSubPosts, setSelectedSubPosts] = useState<SubPost[] | undefined>(initalSubPosts)

  const [post, setPost] = useState<Post | undefined>(getPost(initalSubPosts?.[0]) || initialPost)

  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>

  const posts = useMemo(() => Object.keys(Post).sort((a, b) => tPost(a).localeCompare(tPost(b))), [tPost])
  const subPosts = useMemo<SubPost[]>(
    () => (post ? subPostsByPost[post].sort((a, b) => tPost(a).localeCompare(tPost(b))) : []),
    [post, tPost],
  )

  const translatedSubPosts = useMemo(
    () => subPosts.map((subP) => ({ label: tPost(subP), value: subP })),
    [subPosts, tPost],
  )

  const handleSelectPost = (event: SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as Post
    setSelectedSubPosts([])
    const currentSubPosts: PostObject = (form.getValues('subPosts' as Path<T>) as PostObject) || {}
    if (post) {
      // if post is already selected, reset subPosts
      delete currentSubPosts[post]
    }
    currentSubPosts[selectedPost] = []
    setValue('subPosts', currentSubPosts)

    setPost(selectedPost)
    onChange(currentSubPosts)
  }

  const handleDelete = () => {
    if (!post) {
      return
    }
    const currentSubPosts: PostObject = (form.getValues('subPosts' as Path<T>) as PostObject) || {}
    delete currentSubPosts[post]
    setValue('subPosts', currentSubPosts)
    onChange(currentSubPosts)
  }

  const handleSelectSubPost = (subPostsArr: string[]) => {
    if (!post) {
      return
    }
    setSelectedSubPosts(subPostsArr as SubPost[])
    const currentSubPosts: PostObject = (form.getValues('subPosts' as Path<T>) as PostObject) || {}
    const newSubPosts = { ...currentSubPosts, [post]: subPostsArr }
    setValue('subPosts', newSubPosts)
    onChange(newSubPosts)
  }

  return (
    <Box sx={{ display: 'flex', w: '100%', gap: 2, alignItems: 'end' }}>
      <FormControl sx={{ width: '40%' }}>
        <Select
          name="post"
          data-testid="emission-factor-post"
          labelId="post-select-label"
          value={post || ''}
          onChange={handleSelectPost}
          label={t('post')}
        >
          {posts.map((post) => (
            // check if post is in the list already to avoid issues
            <MenuItem disabled={!postOptions.includes(post as Post)} key={post} value={post}>
              {tPost(post)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ width: '50%' }} error={selectedSubPosts?.length === 0}>
        <MultiSelect
          name="subPosts"
          data-testid="emission-factor-subPost"
          labelId="post-select-label"
          value={selectedSubPosts || []}
          onChange={handleSelectSubPost}
          label={t('subPost')}
          options={translatedSubPosts}
          placeholder="placeholdertest"
          translation={tPost}
        />
      </FormControl>
      <Button
        sx={{ flex: 1, minHeight: 'fit-content', height: '3.5rem' }}
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
