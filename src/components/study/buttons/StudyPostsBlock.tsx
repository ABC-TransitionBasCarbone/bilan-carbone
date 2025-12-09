'use client'
import Block from '@/components/base/Block'
import DebouncedInput from '@/components/base/DebouncedInput'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { downloadStudyPost } from '@/services/study'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { EmissionSourcesFilters } from '@/types/filters'
import DownloadIcon from '@mui/icons-material/Download'
import { EmissionSourceCaracterisation } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'
import styles from '../SubPosts.module.css'
import StudyPostFilters from './StudyPostFilters'

interface Props {
  post: Post
  study: FullStudy
  display: boolean
  setDisplay: (display: boolean) => void
  children: ReactNode
  emissionSources: FullStudy['emissionSources']
  filters: EmissionSourcesFilters
  setFilters: (values: Partial<EmissionSourcesFilters>) => void
  caracterisationOptions: EmissionSourceCaracterisation[]
}

const StudyPostsBlock = ({
  post,
  study,
  display,
  setDisplay,
  children,
  emissionSources,
  filters,
  setFilters,
  caracterisationOptions,
}: Props) => {
  const { environment } = useAppEnvironmentStore()
  const [downloading, setDownloading] = useState(false)
  const tCaracterisations = useTranslations('categorisations')
  const tExport = useTranslations('study.export')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tStudyPost = useTranslations('study.post')
  const tUnit = useTranslations('units')
  const tResultUnits = useTranslations('study.results.units')

  if (!environment) {
    return null
  }

  return (
    <Block
      title={
        <div className="flex gapped">
          <DebouncedInput
            className={styles.searchInput}
            debounce={500}
            value={filters.search}
            onChange={(newValue) => setFilters({ search: newValue })}
            placeholder="🔎"
            data-testid="emission-source-search-field"
          />
          <StudyPostFilters
            filters={filters}
            setFilters={setFilters}
            study={study}
            post={post}
            caracterisationOptions={caracterisationOptions}
          />
        </div>
      }
      actions={[
        {
          actionType: 'loadingButton',
          onClick: async () => {
            setDownloading(true)
            await downloadStudyPost(
              study,
              emissionSources,
              post,
              tExport,
              tCaracterisations,
              tPost,
              tQuality,
              tUnit,
              tResultUnits,
              environment,
            )
            setDownloading(false)
          },
          disabled: emissionSources.length === 0,
          loading: downloading,
          children: (
            <>
              {tExport('download')}
              {!downloading && <DownloadIcon />}
            </>
          ),
        },
        {
          actionType: 'button',
          onClick: () => setDisplay(!display),
          'aria-expanded': display,
          'aria-controls': 'study-post-infography',
          children: tStudyPost(display ? 'hideInfography' : 'displayInfography'),
        },
      ]}
    >
      {children}
    </Block>
  )
}

export default StudyPostsBlock
