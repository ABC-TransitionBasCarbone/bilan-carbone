import { useTranslations } from 'next-intl'

export const translationMock = (translationJson: { [key: string]: string }) => {
  return ((key: string) => translationJson[key]) as unknown as ReturnType<typeof useTranslations>
}
