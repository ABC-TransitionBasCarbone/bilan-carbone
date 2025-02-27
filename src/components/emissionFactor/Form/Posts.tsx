'use client'

import HelpIcon from '@/components/base/HelpIcon'
import { MultiSelect } from '@/components/base/MultiSelect'
import { Select } from '@/components/base/Select'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { FormControl, MenuItem, SelectChangeEvent } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Control, UseFormReturn, UseFormSetValue } from 'react-hook-form'

interface Props<T extends EmissionFactorCommand> {
  post?: Post
  form: UseFormReturn<T>
}

type PostSelected = {
  [key in Post]: SubPost[]
}

const Posts = <T extends EmissionFactorCommand>({ form, post: initalPost }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tGlossary = useTranslations('emissionFactors.create.glossary')
  const tPost = useTranslations('emissionFactors.post')
  const [selectedSubPosts, setSelectedSubPosts] = useState<SubPost[] | undefined>([])
  const [post, setPost] = useState<Post | undefined>(initalPost)
  const [glossary, setGlossary] = useState('')

  const control = form.control as Control<EmissionFactorCommand>
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
    if (post) {
      // if post is already selected, reset subPosts
      const currentSubPosts: PostSelected = form.getValues('subPosts') as PostSelected || {}
      delete currentSubPosts[post]
      setValue('subPosts', currentSubPosts)

    }
    setPost(selectedPost)
  }


  const handleSelectSubPost = (subPostsArr: string[]) => {
    if (!post) return
    setSelectedSubPosts(subPostsArr as SubPost[])
    const currentSubPosts: PostSelected = form.getValues('subPosts') || {}
    const newSubPosts = { ...currentSubPosts, [post]: subPostsArr }
    setValue('subPosts', newSubPosts)
    console.log('new', newSubPosts)
  }

  return (
    <>
      <FormControl>
        <Select
          name="Post"
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
      <MultiSelect
        name="subpost"
        data-testid="emission-factor-subPost"
        labelId="post-select-label"
        value={selectedSubPosts || []}
        onChange={handleSelectSubPost}
        label={t('subPost')}
        options={translatedSubPosts}
      />
      {glossary && (
        <GlossaryModal glossary={glossary} label="emission-factor-post" t={tGlossary} onClose={() => setGlossary('')}>
          {tGlossary(`${glossary}Description`)}
        </GlossaryModal>
      )}
    </>
  )
}

export default Posts
