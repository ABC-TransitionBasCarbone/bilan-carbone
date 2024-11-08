export const gazKeys = ['co2f', 'ch4f', 'ch4b', 'n2o', 'co2b', 'sf6', 'hfc', 'pfc', 'otherGES'] as const
export const defaultGazValues = gazKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}) as Record<
  (typeof gazKeys)[number],
  number
>
