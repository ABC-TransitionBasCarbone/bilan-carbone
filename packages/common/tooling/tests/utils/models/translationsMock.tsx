import { Translations } from '@abc-transitionbascarbone/common'

export const translationMock = (translationJson: { [key: string]: string }) => {
  return ((key: string) => translationJson[key]) as unknown as Translations
}
