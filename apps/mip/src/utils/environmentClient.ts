type ClientEnvKey = 'IMPACT_CO2_SCRIPT_SRC' | 'IMPACT_CO2_DEFAULT_SEARCH'

const CLIENT_ENV: Record<ClientEnvKey, string> = {
  IMPACT_CO2_SCRIPT_SRC: process.env.NEXT_PUBLIC_IMPACT_CO2_SCRIPT_SRC ?? '',
  IMPACT_CO2_DEFAULT_SEARCH: process.env.NEXT_PUBLIC_IMPACT_CO2_DEFAULT_SEARCH ?? '',
}

export const getMipEnvVarClient = (key: ClientEnvKey) => CLIENT_ENV[key]
