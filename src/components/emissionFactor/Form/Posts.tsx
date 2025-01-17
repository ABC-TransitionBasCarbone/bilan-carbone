'use client'

import { FormSelect } from '@/components/form/Select'
import { Post, subPostsByPost } from '@/services/posts'
import { CreateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Control, UseFormReturn, UseFormSetValue } from 'react-hook-form'

interface Props<T extends CreateEmissionFactorCommand> {
  post?: Post
  form: UseFormReturn<T>
}

const Posts = <T extends CreateEmissionFactorCommand>({ form, post: initalPost }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const [post, setPost] = useState<Post | undefined>(initalPost)

  const control = form.control as Control<CreateEmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<CreateEmissionFactorCommand>

  const posts = useMemo(() => Object.keys(Post).sort((a, b) => tPost(a).localeCompare(tPost(b))), [tPost])
  const subPosts = useMemo<SubPost[]>(
    () => (post ? subPostsByPost[post].sort((a, b) => tPost(a).localeCompare(tPost(b))) : []),
    [post, tPost],
  )

  return (
    <>
      <FormControl>
        <InputLabel id="post-select-label">{t('post')}</InputLabel>
        <Select
          label={t('post')}
          data-testid="emission-factor-post"
          labelId="post-select-label"
          value={post || ''}
          onChange={(event) => {
            // @ts-expect-error: Force undefined to trigger error if not filled
            setValue('subPost', undefined)
            setPost(event.target.value as Post)
          }}
        >
          {posts.map((post) => (
            <MenuItem key={post} value={post}>
              {tPost(post)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormSelect
        data-testid="emission-factor-subPost"
        control={control}
        translation={t}
        label={t('subPost')}
        name="subPost"
      >
        {subPosts.length === 0 ? (
          <MenuItem value="" disabled>
            {t('missingPost')}
          </MenuItem>
        ) : (
          subPosts.map((subPost) => (
            <MenuItem key={subPost} value={subPost}>
              {tPost(subPost)}
            </MenuItem>
          ))
        )}
      </FormSelect>
    </>
  )
}

export default Posts
