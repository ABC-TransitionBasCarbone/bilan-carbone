import { expect } from '@jest/globals'
import { ResultsByPost } from './consolidated'
import { mapResultsByPost } from './utils'

describe('mapResultsByPost', () => {
  it('should filter subPosts and sum their values', () => {
    const input: ResultsByPost[] = [
      {
        post: 'Fret',
        value: 0,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            post: 'FretEntrant',
            value: 10,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
          {
            post: 'FretSortant',
            value: 20,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
        ],
      },
      {
        post: 'AutresEmissionsNonEnergetiques',
        value: 0,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            post: 'Agriculture',
            value: 5,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
          {
            post: 'EmissionsLieesAuChangementDAffectationDesSolsCas',
            value: 15,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
        ],
      },
    ]

    // withDependencies = true: only include subPosts where post.include is true
    const result = mapResultsByPost(input, true)
    expect(result).toEqual([
      {
        post: 'Fret',
        value: 30,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            post: 'FretEntrant',
            subPosts: [],
            value: 10,
          },
          {
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            post: 'FretSortant',
            subPosts: [],
            value: 20,
          },
        ],
      },
      {
        post: 'AutresEmissionsNonEnergetiques',
        value: 20,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            post: 'Agriculture',
            subPosts: [],
            value: 5,
          },
          {
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            post: 'EmissionsLieesAuChangementDAffectationDesSolsCas',
            subPosts: [],
            value: 15,
          },
        ],
      },
    ])
  })

  it('should include all subPosts if withDependencies is false', () => {
    const input: ResultsByPost[] = [
      {
        post: 'Fret',
        value: 0,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            post: 'FretEntrant',
            value: 10,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
          {
            post: 'FretSortant',
            value: 20,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
        ],
      },
    ]

    // withDependencies = false: include all subPosts
    const result = mapResultsByPost(input, false)
    expect(result).toEqual([
      {
        post: 'Fret',
        value: 30,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            post: 'FretEntrant',
            value: 10,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
          {
            post: 'FretSortant',
            value: 20,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
        ],
      },
    ])
  })

  it('should handle empty input', () => {
    expect(mapResultsByPost([], true)).toEqual([])
  })
})
