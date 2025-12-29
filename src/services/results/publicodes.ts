import { SubPost } from '@prisma/client'
import Engine from 'publicodes'
import { Post } from '../posts'
import { BaseResultsByPost } from './consolidated'

function safeEvaluate(engine: Engine, ruleName: string | undefined): number {
  if (!ruleName) {
    return 0
  }

  try {
    const result = engine.evaluate(ruleName)
    const value = result.nodeValue

    if (value === null || value === undefined || value === false) {
      return 0
    }

    return typeof value === 'number' ? value : 0
  } catch (e) {
    console.error(`Error evaluating rule "${ruleName}":`, e)
    return 0
  }
}

export function computeBaseResultsByPostFromEngine<P extends Post>(
  engine: Engine,
  posts: P[],
  subPostsByPost: Record<P, SubPost[]>,
  tPost: (key: string) => string,
  getPostRuleName: (post: P) => string,
  getSubPostRuleName: (subPost: SubPost) => string | undefined,
): BaseResultsByPost[] {
  const postResults = posts
    .map((post) => {
      const postRuleName = getPostRuleName(post)
      const postValue = safeEvaluate(engine, postRuleName)

      return {
        post,
        label: tPost(post),
        value: postValue,
        children: subPostsByPost[post]
          .map((subPost) => {
            const subPostRuleName = getSubPostRuleName(subPost)
            const subPostValue = safeEvaluate(engine, subPostRuleName)

            return {
              post: subPost,
              label: tPost(subPost),
              value: subPostValue,
              children: [],
            } as BaseResultsByPost
          })
          .sort((a, b) => a.label.localeCompare(b.label)),
      } as BaseResultsByPost
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  return [...postResults, computeTotalForBaseResults(postResults, tPost)]
}

export function computeTotalForBaseResults(
  postResults: BaseResultsByPost[],
  tPost: (key: string) => string,
): BaseResultsByPost {
  const totalValue = postResults.reduce((acc, post) => acc + post.value, 0)

  return {
    post: 'total',
    label: tPost('total'),
    value: totalValue,
    children: [],
  }
}
