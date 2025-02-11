'use client'

import { Select } from '@/components/base/Select'
import { FormSelect } from '@/components/form/Select'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { FormControl, MenuItem } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Control, UseFormReturn, UseFormSetValue } from 'react-hook-form'

interface Props<T extends EmissionFactorCommand> {
  post?: Post
  form: UseFormReturn<T>
}

const Posts = <T extends EmissionFactorCommand>({ form, post: initalPost }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const [post, setPost] = useState<Post | undefined>(initalPost)

  const control = form.control as Control<EmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>

  const posts = useMemo(() => Object.keys(Post).sort((a, b) => tPost(a).localeCompare(tPost(b))), [tPost])
  const subPosts = useMemo<SubPost[]>(
    () => (post ? subPostsByPost[post].sort((a, b) => tPost(a).localeCompare(tPost(b))) : []),
    [post, tPost],
  )

  return (
    <>
      <FormControl>
        <div className="mb-2 align-center">
          <span className="inputLabel bold">{t('post')}</span>
        </div>
        <Select
          label={t('post')}
          name="Post"
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
