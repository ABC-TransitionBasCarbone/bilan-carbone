import xlsx from 'node-xlsx'

export interface OldPostAndSubPostKey {
  domain: string
  category: string
  subCategory: string
  oldPost: string
  oldSubPost: string
}

export interface NewPostAndSubPosts {
  newPost: string
  newSubPost: string
}

export class OldNewPostAndSubPostsMapping {
  oldNewPostAndSubPostMap = new Map<OldPostAndSubPostKey, NewPostAndSubPosts>()

  constructor() {
    const postAndSubPostFilename = 'Lien postes et sous postes.csv'
    const workSheets = xlsx.parse(postAndSubPostFilename)
    const data = workSheets[0].data.slice(1)
    data.forEach((row) => {
      this.oldNewPostAndSubPostMap.set(
        {
          domain: row[0],
          category: row[1],
          subCategory: row[2],
          oldPost: row[3],
          oldSubPost: row[4],
        },
        { newPost: row[8], newSubPost: row[7] },
      )
    })
  }

  getNewPostAndSubPost = (oldPostAndSubPostKey: OldPostAndSubPostKey) => {
    const entry = this.oldNewPostAndSubPostMap
      .entries()
      .find(
        ([key]) =>
          key.domain === oldPostAndSubPostKey.domain &&
          key.category === oldPostAndSubPostKey.category &&
          key.subCategory === oldPostAndSubPostKey.subCategory &&
          key.oldPost === oldPostAndSubPostKey.oldPost &&
          key.oldSubPost === oldPostAndSubPostKey.oldSubPost,
      )
    if (!entry) {
      throw new Error(
        `Mapping manquant pour le domaine : "${oldPostAndSubPostKey.domain}", la catégorie : "${oldPostAndSubPostKey.category}", la sous-catégory : "${oldPostAndSubPostKey.subCategory}", l'ancien poste : "${oldPostAndSubPostKey.oldPost}" et l'ancien sous poste : "${oldPostAndSubPostKey.oldSubPost}" !`,
      )
    } else {
      return entry[1]
    }
  }
}
