import { TOTAL_RULE } from '@/constants/publicodes'
import { customPostOrder } from '@/environments/clickson/utils/constant'
import { sortByCustomOrder } from '@/utils/array'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Environment, StudyResultUnit, SubPost } from '@repo/db-common'
import Engine from 'publicodes'
import { hasCustomPostOrder } from '../permissions/environment'
import { Post } from '../posts'
import { BaseResultsByPost } from './consolidated'

function safeEvaluate(engine: Engine, ruleName: string | undefined): number {
  if (!ruleName) {
    return 0
  }

  try {
    const result = engine.evaluate(ruleName)
    const value = result.nodeValue

    if (!value) {
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
  environment?: Environment,
): BaseResultsByPost[] {
  let postResults = posts
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
            }
          })
          .sort((a, b) => a.label.localeCompare(b.label)),
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  if (environment && hasCustomPostOrder(environment)) {
    postResults = sortByCustomOrder(postResults, customPostOrder, (item) => item.post)
  } else {
    postResults.sort((a, b) => a.label.localeCompare(b.label))
  }

  return [...postResults, computeTotalForBaseResults(engine, postResults, tPost)]
}

export function computeTotalForBaseResults(
  engine: Engine,
  postResults: BaseResultsByPost[],
  tPost: (key: string) => string,
): BaseResultsByPost {
  const value = engine.getRule(TOTAL_RULE)
    ? safeEvaluate(engine, TOTAL_RULE)
    : postResults.reduce((acc, post) => acc + post.value, 0)

  return {
    post: 'total',
    label: tPost('total'),
    children: [],
    value,
  }
}

export function aggregateBaseResultsByPost(resultsList: BaseResultsByPost[][]): BaseResultsByPost[] {
  if (resultsList.length === 0) {
    return []
  }

  return resultsList.reduce((postResultsAcc, results) =>
    postResultsAcc.map((postResultAcc, i) => ({
      ...postResultAcc,
      value: postResultAcc.value + results[i].value,
      children: postResultAcc.children.map((postResultChildAcc, j) => ({
        ...postResultChildAcc,
        value: postResultChildAcc.value + results[i].children[j].value,
      })),
    })),
  )
}

export function getTotalValueFromBaseResults(postResults: BaseResultsByPost[], studyUnit?: StudyResultUnit): number {
  const total = postResults.find((r) => r.post === 'total')?.value ?? 0
  return studyUnit ? total / STUDY_UNIT_VALUES[studyUnit] : total
}
