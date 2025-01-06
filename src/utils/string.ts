export const displayOnlyExistingDataWithDash = (data: (string | null | undefined | number)[]) =>
  data.filter((d) => !!d).join(' - ')
