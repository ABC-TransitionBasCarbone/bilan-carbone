import { createFormation, deleteFormation } from '../../db/formation'

export const addFormation = async (name: string, link: string) => {
  const result = await createFormation(name, link)
  console.log('Formation ajoutée : ', result.name)
}

export const removeFormation = async (name: string) => {
  const result = await deleteFormation(name)
  console.log('Formation supprimée : ', result.name)
}
