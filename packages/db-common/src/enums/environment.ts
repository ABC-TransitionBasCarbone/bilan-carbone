export const Environment = {
  BC: 'BC',
  CUT: 'CUT',
  TILT: 'TILT',
  CLICKSON: 'CLICKSON',
} as const

export type Environment = (typeof Environment)[keyof typeof Environment]