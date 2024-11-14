'use client'

import { useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { CreateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import { SubPost } from '@prisma/client'
import { Post, subPostsByPost } from '@/services/posts'
import { FormSelect } from '@/components/form/Select'

interface Props {
  form: UseFormReturn<CreateEmissionFactorCommand>
}

const Posts = ({ form }: Props) => {
  const t = useTranslations('emissionFactors.create')
  const tPost = useTranslations('emissionFactors.post')
  const [post, setPost] = useState<Post>()

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
          data-testid="new-emission-post"
          labelId="post-select-label"
          value={post || ''}
          onChange={(event) => {
            // @ts-expect-error: Force undefined to trigger error if not filled
            form.setValue('subPost', undefined)
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
        data-testid="new-emission-subPost"
        control={form.control}
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
