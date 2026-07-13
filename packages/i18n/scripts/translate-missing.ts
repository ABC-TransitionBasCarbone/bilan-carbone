/**
 * Detects missing translation keys vs the FR source and fills them using Claude.
 * Glossary is fetched at runtime from the methode-bilan-carbone repo.
 *
 * Covers common (packages/i18n), bc/clickson/cut/tilt (apps/bilan-carbone) and mip (apps/mip).
 *
 * Modes:
 *   default        backfill — every key missing/empty in the target (use via subscription)
 *   --changed-only incremental — only FR keys added/modified since --base (default HEAD~1); the pipeline/API mode
 *
 * Usage:
 *   yarn tsx scripts/translate-missing.ts --locale en                    # backfill, English
 *   yarn tsx scripts/translate-missing.ts --locale es --file bc          # a single file
 *   yarn tsx scripts/translate-missing.ts --all-locales                  # backfill, all files, all locales
 *   yarn tsx scripts/translate-missing.ts --all-locales --changed-only   # incremental (pipeline)
 *   ANTHROPIC_API_KEY=sk-... yarn tsx scripts/translate-missing.ts --locale en
 */

import Anthropic from '@anthropic-ai/sdk'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, relative, sep } from 'path'

// Repo root, resolved from packages/i18n/scripts → ../../..
const REPO_ROOT = join(__dirname, '../../..')

const GLOSSARY_URL =
  'https://raw.githubusercontent.com/ABC-TransitionBasCarbone/methode-bilan-carbone/main/glossaire.csv'

// Translation targets: each points to a `<locale>/<file>.json` tree with its own FR source.
// `publicodes/**` is intentionally excluded — only flat UI string files are translated.
type Target = { dir: string; file: string }

const TRANSLATION_TARGETS: Target[] = [
  { dir: join(__dirname, '../translations'), file: 'common' },
  { dir: join(REPO_ROOT, 'apps/bilan-carbone/src/i18n/translations'), file: 'bc' },
  { dir: join(REPO_ROOT, 'apps/bilan-carbone/src/i18n/translations'), file: 'clickson' },
  { dir: join(REPO_ROOT, 'apps/bilan-carbone/src/i18n/translations'), file: 'cut' },
  { dir: join(REPO_ROOT, 'apps/bilan-carbone/src/i18n/translations'), file: 'tilt' },
  { dir: join(REPO_ROOT, 'apps/mip/src/i18n/translations'), file: 'mip' },
]

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  it: 'Italian',
  ro: 'Romanian',
  hr: 'Croatian',
  hu: 'Hungarian',
  el: 'Greek',
}

type JsonValue = string | JsonObject | JsonArray | number | boolean | null
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

// ── Glossary ──────────────────────────────────────────────────────────────────

async function loadGlossary(): Promise<string> {
  try {
    const res = await fetch(GLOSSARY_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const csv = await res.text()

    const lines = csv.split('\n').slice(1) // skip header
    const entries: string[] = []

    for (const line of lines) {
      const [fr, en] = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
      if (fr && en && fr !== en) {
        entries.push(`${fr} → ${en}`)
      }
    }

    console.log(`  Loaded ${entries.length} glossary terms from methode-bilan-carbone`)
    return entries.join('\n')
  } catch (e) {
    console.warn(`  Could not fetch glossary (${e}), using fallback`)
    return `
Bilan Carbone® → Bilan Carbone® (proper name/trademark, never translate)
Poste / Postes → Category / Categories
Sous-poste / Sous-postes → Sub-category / Sub-categories
Facteur d'émission → Emission factor
Périmètre organisationnel → Organisational boundary
Périmètre opérationnel → Operational boundary
Démarche → Approach
Mobilisation → Stakeholder engagement
Bilan GES → GHG Assessment
    `.trim()
  }
}

// ── Diff helpers ──────────────────────────────────────────────────────────────

function getMissingKeys(source: JsonObject, target: JsonObject, path = ''): Record<string, string> {
  const missing: Record<string, string> = {}

  for (const [key, value] of Object.entries(source)) {
    const currentPath = path ? `${path}.${key}` : key

    if (typeof value === 'string') {
      // Only translate keys that are filled in FR and missing/empty in the target.
      if (value === '') continue
      const targetValue = target[key]
      if (targetValue === undefined || targetValue === '') {
        missing[currentPath] = value
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const targetNested =
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
          ? (target[key] as JsonObject)
          : {}
      Object.assign(missing, getMissingKeys(value as JsonObject, targetNested, currentPath))
    }
  }

  return missing
}

function setNestedKey(obj: JsonObject, path: string, value: string): void {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {}
    }
    current = current[parts[i]] as JsonObject
  }
  current[parts[parts.length - 1]] = value
}

// Flattens an object to { "a.b.c": "value" } for string leaves only.
function flattenStrings(obj: JsonObject, path = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key
    if (typeof value === 'string') {
      out[currentPath] = value
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flattenStrings(value as JsonObject, currentPath))
    }
  }
  return out
}

// Reads a JSON file as it was at a given git ref; null if it didn't exist then.
function readJsonAtRef(repoRelPath: string, ref: string): JsonObject | null {
  try {
    const out = execSync(`git show ${ref}:${repoRelPath}`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })
    return JSON.parse(out) as JsonObject
  } catch {
    return null
  }
}

// Paths whose FR value was added or modified vs the base ref — the only keys
// the incremental (--changed-only) mode sends to the API.
function getChangedPaths(current: JsonObject, base: JsonObject | null): Record<string, string> {
  const cur = flattenStrings(current)
  const old = base ? flattenStrings(base) : {}
  const changed: Record<string, string> = {}
  for (const [path, value] of Object.entries(cur)) {
    // Ignore empty FR sources — nothing to translate.
    if (value !== '' && old[path] !== value) changed[path] = value
  }
  return changed
}

// ── Claude call ───────────────────────────────────────────────────────────────

const CHUNK_SIZE = 50

async function translateBatch(
  strings: Record<string, string>,
  targetLocale: string,
  glossary: string,
  client: Anthropic,
): Promise<Record<string, string>> {
  const langName = LOCALE_NAMES[targetLocale] ?? targetLocale

  const prompt = `You are translating UI strings for Bilan Carbone®, a carbon footprint assessment tool used by organisations.

Glossary — respect these domain-specific translations:
${glossary}

Rules:
- Keep {variable} placeholders exactly as-is (e.g. {count}, {name}, {date})
- Keep HTML tags unchanged
- Keep "Bilan Carbone®" untranslated
- Translate from French to ${langName}
- Return ONLY a valid JSON object, no explanation, no markdown fences

Translate these French strings to ${langName}:
${JSON.stringify(strings, null, 2)}

Return a JSON object with the exact same keys and translated values.`

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in Claude response:\n${text}`)

  return JSON.parse(jsonMatch[0]) as Record<string, string>
}

// ── File translation ──────────────────────────────────────────────────────────

type Mode = { changedOnly: boolean; base: string }

async function translateFile(
  dir: string,
  file: string,
  locale: string,
  glossary: string,
  client: Anthropic,
  mode: Mode,
): Promise<void> {
  const frPath = join(dir, 'fr', `${file}.json`)
  const targetPath = join(dir, locale, `${file}.json`)

  if (!existsSync(frPath)) {
    console.warn(`  Skipping ${file}: fr/${file}.json not found`)
    return
  }

  // Only fill locales the product already ships — don't create new language folders
  // (e.g. MIP only has fr/en, so es/it/… are skipped rather than invented).
  if (!existsSync(join(dir, locale))) {
    console.log(`  ⤷ Skipping ${file}: locale "${locale}" not present in ${dir}`)
    return
  }

  const frContent = JSON.parse(readFileSync(frPath, 'utf-8')) as JsonObject
  let targetContent: JsonObject = {}

  if (existsSync(targetPath)) {
    targetContent = JSON.parse(readFileSync(targetPath, 'utf-8')) as JsonObject
  } else {
    console.log(`  No existing ${locale}/${file}.json — will create from scratch`)
    mkdirSync(dirname(targetPath), { recursive: true })
  }

  // Two modes:
  // - changed-only (pipeline/API): only keys added or modified in FR since `base` → small deltas.
  //   Changed keys are re-translated even if the target already has a value (FR changed → stale).
  // - default (backfill/subscription): every key missing or empty in the target.
  let toTranslate: Record<string, string>
  if (mode.changedOnly) {
    const repoRel = relative(REPO_ROOT, frPath).split(sep).join('/')
    const base = readJsonAtRef(repoRel, mode.base)
    toTranslate = getChangedPaths(frContent, base)
  } else {
    toTranslate = getMissingKeys(frContent, targetContent)
  }
  const count = Object.keys(toTranslate).length

  if (count === 0) {
    console.log(`  ✓ ${locale}/${file}.json — nothing to translate`)
    return
  }

  const label = mode.changedOnly ? 'changed' : 'missing'
  console.log(`  Translating ${count} ${label} key(s) in ${locale}/${file}.json...`)

  const entries = Object.entries(toTranslate)
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = Object.fromEntries(entries.slice(i, i + CHUNK_SIZE))
    const translated = await translateBatch(chunk, locale, glossary, client)

    for (const [path, value] of Object.entries(translated)) {
      setNestedKey(targetContent, path, value)
    }

    const end = Math.min(i + CHUNK_SIZE, entries.length)
    console.log(`    ✓ keys ${i + 1}–${end}`)
  }

  writeFileSync(targetPath, JSON.stringify(targetContent, null, 2) + '\n', 'utf-8')
  console.log(`  → Written ${locale}/${file}.json`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  const allLocales = args.includes('--all-locales')
  const localeIdx = args.indexOf('--locale')
  const locale = localeIdx !== -1 ? args[localeIdx + 1] : 'en'
  const fileIdx = args.indexOf('--file')
  const fileArg = fileIdx !== -1 ? args[fileIdx + 1] : 'all'
  const changedOnly = args.includes('--changed-only')
  const baseIdx = args.indexOf('--base')
  const base = baseIdx !== -1 ? args[baseIdx + 1] : 'HEAD~1'

  const localesToProcess = allLocales ? Object.keys(LOCALE_NAMES) : [locale]

  if (!allLocales && !LOCALE_NAMES[locale]) {
    console.error(`Unknown locale "${locale}". Supported: ${Object.keys(LOCALE_NAMES).join(', ')}`)
    process.exit(1)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is required')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })
  const targets = fileArg === 'all' ? TRANSLATION_TARGETS : TRANSLATION_TARGETS.filter((t) => t.file === fileArg)

  if (targets.length === 0) {
    const known = [...new Set(TRANSLATION_TARGETS.map((t) => t.file))].join(', ')
    console.error(`Unknown file "${fileArg}". Supported: all, ${known}`)
    process.exit(1)
  }

  console.log('\nFetching glossary...')
  const glossary = await loadGlossary()

  const mode: Mode = { changedOnly, base }
  if (changedOnly) console.log(`Mode: changed-only (diff vs ${base}) — incremental keys only`)

  for (const loc of localesToProcess) {
    console.log(`\nTranslating to: ${LOCALE_NAMES[loc]} (${loc})`)
    console.log(`Files: ${targets.map((t) => t.file).join(', ')}`)

    for (const target of targets) {
      await translateFile(target.dir, target.file, loc, glossary, client, mode)
    }
  }

  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
