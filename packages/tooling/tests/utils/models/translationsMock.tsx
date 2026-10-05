import { Translations } from '@abc-transitionbascarbone/shared'

export const translationMock = (translationJson: { [key: string]: string }) => {
  return ((key: string) => translationJson[key]) as unknown as Translations
}
