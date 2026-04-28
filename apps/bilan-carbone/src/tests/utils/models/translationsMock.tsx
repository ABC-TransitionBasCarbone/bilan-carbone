import { Translations } from '@repo/lib'

export const translationMock = (translationJson: { [key: string]: string }) => {
  return ((key: string) => translationJson[key]) as unknown as Translations
}
