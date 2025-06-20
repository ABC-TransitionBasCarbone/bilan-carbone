import PostInfography from '@/components/study/infography/PostInfography'
import { FullStudy } from '@/db/study'
import { CutPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { styled } from '@mui/material'

interface Props {
  study: FullStudy
  data: ResultsByPost[]
}

const StyledGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gridTemplateRows: 'repeat(3, 8.75rem)', // Fixed height allows overflow of subpost menu
  gap: '0.75rem',
  width: '100%',
  paddingBottom: '12rem',
})

const AllPostsInfography = ({ study, data }: Props) => {
  const cutPosts = Object.values(CutPost)
  return (
    <StyledGrid>
      {cutPosts.map((post) => (
        <PostInfography
          key={post}
          studyId={study.id}
          data={data.find((d) => d.post === post)}
          post={post}
          resultsUnit={study.resultsUnit}
        />
      ))}
    </StyledGrid>
  )
}

export default AllPostsInfography
