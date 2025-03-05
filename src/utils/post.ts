import { Post, subPostsByPost } from '@/services/posts'
import { SubPost } from '@prisma/client'

export const getPost = (subPost?: SubPost) =>
  subPost
    ? (Object.keys(subPostsByPost).find((post) => subPostsByPost[post as Post].includes(subPost)) as Post)
    : undefined

export const flattenSubposts = (subPosts: Record<Post, SubPost[]>) =>
  Object.keys(subPosts)
    .map((post) => (subPosts?.[post as Post] || []).flat())
    .flat()
