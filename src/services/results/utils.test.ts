import { ResultsByPost } from './consolidated'
import { mapResultsByPost } from './utils'

// Mock filterWithDependencies
jest.mock('./filterWithDependencies', () => ({
  filterWithDependencies: jest.fn((subPost, withDependencies) => (withDependencies ? subPost.include : true)),
}))

// Removed unused SubPost type

describe('mapResultsByPost', () => {
  it('should filter subPosts and sum their values', () => {
    const input: ResultsByPost[] = [
      {
        post: 'total',
        value: 0,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            post: 'total',
            value: 10,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
          {
            post: 'total',
            value: 20,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
        ],
      },
      {
        post: 'total',
        value: 0,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            post: { include: true } as any,
            value: 5,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
          {
            post: { include: true } as any,
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
    expect(result).equal([
      {
        postId: '1',
        subPosts: [{ post: { include: true }, value: 10 }],
        value: 10,
      },
      {
        postId: '2',
        subPosts: [
          { post: { include: true }, value: 5 },
          { post: { include: true }, value: 15 },
        ],
        value: 20,
      },
    ])
  })

  it('should include all subPosts if withDependencies is false', () => {
    const input: ResultsByPost[] = [
      {
        post: 'total',
        value: 0,
        monetaryValue: 0,
        numberOfEmissionSource: 0,
        numberOfValidatedEmissionSource: 0,
        subPosts: [
          {
            post: { include: true } as any,
            value: 10,
            monetaryValue: 0,
            numberOfEmissionSource: 0,
            numberOfValidatedEmissionSource: 0,
            subPosts: [],
          },
          {
            post: { include: false } as any,
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
    expect(result).equal([
      {
        subPosts: [
          { post: { include: true }, value: 10 },
          { post: { include: false }, value: 20 },
        ],
        value: 30,
      },
    ])
  })

  it('should handle empty input', () => {
    expect(mapResultsByPost([], true)).equal([])
  })
})
