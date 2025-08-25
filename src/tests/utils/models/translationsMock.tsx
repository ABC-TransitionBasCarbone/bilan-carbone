export const translationMock = (translationJson: { [key: string]: string }) => {
  return (key: string) => translationJson[key]
}
