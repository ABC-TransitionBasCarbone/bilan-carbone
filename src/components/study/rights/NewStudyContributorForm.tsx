'use client'

import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import MultiplePosts from '@/components/emissionFactor/Form/MultiplePosts'
import { FormTextField } from '@/components/form/TextField'
import { AccountWithUser } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { displayingStudyRightModalForAddingContributors } from '@/services/permissions/environment'
import { environmentPostMapping, Post, subPostsByPost } from '@/services/posts'
import { newStudyContributor } from '@/services/serverFunctions/study'
import {
  NewStudyContributorCommand,
  NewStudyContributorCommandValidation,
} from '@/services/serverFunctions/study.command'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { zodResolver } from '@hookform/resolvers/zod'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import NewStudyRightModal from './NewStudyRightModal'
import { StudyContributorDeleteParams } from './StudyContributorsTable'

interface Props {
  study: FullStudy
  accounts: Awaited<ReturnType<typeof getOrganizationVersionAccounts>>
  defaultAccount?: AccountWithUser
  defaultSubPosts?: SubPost[]
}

const NewStudyContributorForm = ({ study, accounts, defaultAccount, defaultSubPosts }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.newContributor')

  const { callServerFunction } = useServerFunction()
  const [otherOrganizationVersion, setOtherOrganizationVersion] = useState(false)
  const [loading, setLoading] = useState(false)

  const { environment } = useAppEnvironmentStore()

  const form = useForm<NewStudyContributorCommand>({
    resolver: zodResolver(NewStudyContributorCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      email: defaultAccount?.user.email || '',
    },
  })

  const onSubmit = useCallback(
    async (command: NewStudyContributorCommand) => {
      if (
        (environment && !displayingStudyRightModalForAddingContributors(environment)) ||
        otherOrganizationVersion ||
        accounts.some((account) => account.user.email === form.getValues('email')) ||
        defaultAccount
      ) {
        setLoading(true)
        const toDeleteContributors = [] as StudyContributorDeleteParams[]
        if (environment && defaultSubPosts && defaultSubPosts.length > 0 && defaultAccount) {
          const selectedSubposts = form.getValues('subPosts') || {}
          for (const subPost of defaultSubPosts) {
            const post = Object.values(environmentPostMapping[environment]).find((postKey) =>
              subPostsByPost?.[postKey as Post]?.includes(subPost),
            ) as Post
            if ((post && !(post in selectedSubposts)) || !selectedSubposts[post]?.includes(subPost)) {
              toDeleteContributors.push({
                post,
                accountId: defaultAccount.id,
                subPosts: [subPost],
              })
            }
          }
        }
        await callServerFunction(() => newStudyContributor(command, toDeleteContributors), {
          getErrorMessage: (error) => t(error),
          onSuccess: () => {
            setLoading(false)
            router.push(`/etudes/${study.id}/cadrage`)
          },
          onError: () => {
            setLoading(false)
          },
        })
      } else {
        setOtherOrganizationVersion(true)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [environment, otherOrganizationVersion, accounts, callServerFunction, study.id],
  )

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="study-contributor-email"
        control={form.control}
        name="email"
        label={t('email')}
        trim
        disabled={!!defaultAccount}
      />
      <MultiplePosts form={form} context="studyContributor" selectAll defaultSubPosts={defaultSubPosts} />
      <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="study-contributor-create-button">
        {defaultAccount ? t('edit') : t('create')}
      </LoadingButton>
      <NewStudyRightModal
        otherOrganizationVersion={otherOrganizationVersion}
        decline={() => setOtherOrganizationVersion(false)}
        accept={form.handleSubmit(onSubmit)}
        loading={loading}
      />
    </Form>
  )
}

export default NewStudyContributorForm
