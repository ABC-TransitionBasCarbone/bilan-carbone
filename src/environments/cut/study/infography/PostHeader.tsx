import PostIcon from '@/components/study/infography/icons/PostIcon'
import { Post } from '@/services/posts'
import { styled } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { CutProgressBar } from './CutProgressBar'

interface Props {
  post: Post | SubPost
  mainPost: Post | null
  emissionValue: string
  percent: number
}

const StyledPostHeader = styled('div', { shouldForwardProp: (prop) => prop !== 'post' })<{ post: Post }>(
  ({ theme, post }) => ({
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '1fr 4fr',
    color: 'black',
    backgroundColor: theme.custom.postColors[post].light,
    height: '7.75rem',
    overflow: 'hidden',
    borderRadius: '0.5rem',
  }),
)

const StyledIconColumn = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  borderRight: `2px solid ${theme.palette.primary.light}`,
}))

const StyledContentColumn = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: '0.25rem',
  padding: '0rem 1rem',
  position: 'relative',
  height: '100%',
  width: '100%',
})

const StyledTitle = styled('div')(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  fontSize: '1.125rem',
  fontWeight: 700,
  textAlign: 'left',
}))

const StyledEmissionValue = styled('div')({
  fontSize: '1.25rem',
  fontWeight: 800,
  textAlign: 'left',
  color: 'white',
})

export const CutPostHeader = ({ post, mainPost, emissionValue, percent }: Props) => {
  const t = useTranslations('emissionFactors.post')

  if (!mainPost) {
    return null
  }

  return (
    <StyledPostHeader post={mainPost}>
      <StyledIconColumn>
        <PostIcon post={mainPost} />
      </StyledIconColumn>
      <StyledContentColumn>
        <StyledTitle>{t(post)}</StyledTitle>
        <StyledEmissionValue>{emissionValue}</StyledEmissionValue>
        <div className="mt-2 w100">
          <CutProgressBar value={percent} />
        </div>
      </StyledContentColumn>
    </StyledPostHeader>
  )
}
