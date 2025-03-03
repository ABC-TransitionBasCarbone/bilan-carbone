'use client'

import Button from '@/components/base/Button'
import HelpIcon from '@/components/base/HelpIcon'
import DeleteIcon from '@mui/icons-material/Delete'
import { MultiSelect } from '@/components/base/MultiSelect'
import { Select } from '@/components/base/Select'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { Post, PostObject, subPostsByPost } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { getPost } from '@/utils/post'
import { Box, FormControl, MenuItem, SelectChangeEvent } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { UseFormReturn, UseFormSetValue } from 'react-hook-form'


interface Props<T extends EmissionFactorCommand> {
  post?: Post 
  subPosts?: SubPost[] 
  form: UseFormReturn<T>
  onChange: (updatedPosts: PostObject) => void
}



const Posts = <T extends EmissionFactorCommand>({ form, subPosts: initalSubPosts, post: initialPost, onChange }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tGlossary = useTranslations('emissionFactors.create.glossary')
  const tPost = useTranslations('emissionFactors.post')
  const [selectedSubPosts, setSelectedSubPosts] = useState<SubPost[] | undefined>(initalSubPosts)
  
  const [post, setPost] = useState<Post | undefined>(getPost(initalSubPosts?.[0]) || initialPost)
  const [glossary, setGlossary] = useState('')

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

  const handleSelectPost = (event : SelectChangeEvent<unknown>) => {
    const selectedPost = event.target.value as Post
    setSelectedSubPosts([])
    const currentSubPosts: PostObject = form.getValues('subPosts') as PostObject || {}
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
    if (!post) return
    const currentSubPosts: PostObject = form.getValues('subPosts') as PostObject || {}
    delete currentSubPosts[post]
    setValue('subPosts', currentSubPosts)
    onChange(currentSubPosts)
  }


  const handleSelectSubPost = (subPostsArr: string[]) => {
    if (!post) return
    setSelectedSubPosts(subPostsArr as SubPost[])
    const currentSubPosts: PostObject = form.getValues('subPosts') || {}
    const newSubPosts = { ...currentSubPosts, [post]: subPostsArr }
    setValue('subPosts', newSubPosts)
    console.log('new', newSubPosts)
  }

  return (
    <Box sx={{ display: 'flex', w: '100%', gap: 2, alignItems: "end"}}>
      <FormControl sx={{ width: '40%' }}>
        <Select
          name="subPosts"
          data-testid="emission-factor-post"
          labelId="post-select-label"
          value={post || ''}
          onChange={handleSelectPost}
          label={t('post')}
          icon={<HelpIcon onClick={() => setGlossary('post')} label={tGlossary('title')} />}
          iconPosition="after"
        >
          {posts.map((post) => (
            <MenuItem key={post} value={post}>
              {tPost(post)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ width: '50%' }}>
      <MultiSelect
        name="subpost"
        data-testid="emission-factor-subPost"
        labelId="post-select-label"
        value={selectedSubPosts || []}
        onChange={handleSelectSubPost}
        label={t('subPost')}
        options={translatedSubPosts}
      />
      </FormControl>
      <Button
        sx={{ flex: 1, minHeight: 'fit-content', height: "3.5rem" }}
        data-testid="delete-site-button"
        title={t('delete')}
        aria-label={t('delete')}
        onClick={handleDelete}>
        <DeleteIcon />
      </Button>

      {glossary && (
        <GlossaryModal glossary={glossary} label="emission-factor-post" t={tGlossary} onClose={() => setGlossary('')}>
          {tGlossary(`${glossary}Description`)}
        </GlossaryModal>
      )}
    </Box>
  )
}

export default Posts
