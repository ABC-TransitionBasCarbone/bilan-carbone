type FormatContext = Record<string, unknown>
type ReplacerFn = (context: FormatContext) => string
type Replacers = Record<string, ReplacerFn>
const REGEX_INTERPOLATION = /{{\s*(\w+)\s*}}/g

/**
 * Replaces dynamic variables, for example: "{{startYear}}" -> "2025"
 * Based on common syntaxes like Angular, Mustache, Vue.js, React, etc.
 * @param label - The string containing variables inside {{ }}.
 * @param context - Object containing replacement values (e.g., { startYear: 2025 }).
 * @param customReplacers - Custom method(s) to transform values before insertion (optional).
 * @returns The label with all its values "interpolated" (replaced).
 */
export function formatDynamicLabel(label: string, context: FormatContext, customReplacers: Replacers = {}): string {
  const defaultReplacers: Replacers = {
    startYear: (ctx) => (ctx.study as { startDate: Date })?.startDate?.getFullYear().toString() ?? '',
  }

  const replacers = { ...defaultReplacers, ...customReplacers }

  return label.replace(REGEX_INTERPOLATION, (_, key) => {
    const replacer = replacers[key]
    return replacer ? replacer(context) : `{{${key}}}`
  })
}
