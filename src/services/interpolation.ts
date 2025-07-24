type FormatContext = Record<string, unknown>
type ReplacerFn = (context: FormatContext) => string
type Replacers = Record<string, ReplacerFn>
const REGEX_INTERPOLATION = /{{\s*(\w+)\s*}}/g

/**
 * Remplace des variables dynamique, par exemple : "{{startYear}}" -> "2025"
 * Basé sur des syntax courrante type Angular, Mustach, Vue.js, React, etc.
 * @param label - La string contenant des variables entre {{ }}.
 * @param context - Objet contenant les valeurs de remplacement (ex: { startYear: 2025 }).
 * @param customReplacers - Méthode(s) custom(s) pour transformer des valeurs avant insertion (optionnel).
 * @returns le label avec toutes ces valeurs "interpolées" (modifiés).
 */
export function formatDynamicLabel(label: string, context: FormatContext, customReplacers: Replacers = {}): string {
  const defaultReplacers: Replacers = {
    startYear: (ctx) => (ctx.study as { startDate: Date })?.startDate?.getFullYear().toString() ?? '',
  }

  const replacers = { ...defaultReplacers, ...customReplacers }

  return label.replace(REGEX_INTERPOLATION, (_, key) => {
    console.debug({ key })
    const replacer = replacers[key]
    return replacer ? replacer(context) : `{{${key}}}`
  })
}
