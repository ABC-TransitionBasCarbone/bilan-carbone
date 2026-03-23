import { EmissionFactorBase, Import, SubPost } from '@repo/db-common/enums'
import { ImportEmissionFactor, mapEmissionFactors } from '../import'
import { elementsBySubPost } from '../posts.config'

const getSubPostsFunc = (emissionFactor: ImportEmissionFactor) =>
  Object.entries(elementsBySubPost)
    .filter(([, elements]) => elements.some((element) => element === emissionFactor["Identifiant_de_l'élément"]))
    .map(([subPost]) => subPost as SubPost)

export const mapBaseEmpreinteEmissionFactors = (emissionFactor: ImportEmissionFactor, versionId: string) => ({
  ...mapEmissionFactors(emissionFactor, Import.BaseEmpreinte, versionId, getSubPostsFunc),
  base: getSubPostsFunc(emissionFactor).includes(SubPost.Electricite) ? EmissionFactorBase.LocationBased : null,
})
