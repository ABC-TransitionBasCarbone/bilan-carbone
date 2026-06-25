/**
 * Detects missing translation keys vs the FR source and fills them using Claude.
 * Glossary is fetched at runtime from the methode-bilan-carbone repo.
 *
 * Usage:
 *   yarn tsx scripts/translate-missing.ts --locale en
 *   yarn tsx scripts/translate-missing.ts --locale es --file all
 *   yarn tsx scripts/translate-missing.ts --all-locales
 *   ANTHROPIC_API_KEY=sk-... yarn tsx scripts/translate-missing.ts --locale en
 */

import Anthropic from '@anthropic-ai/sdk'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

const TRANSLATIONS_DIR = join(__dirname, '../translations')

const GLOSSARY_URL =
  'https://raw.githubusercontent.com/ABC-TransitionBasCarbone/methode-bilan-carbone/main/glossaire.csv'

// Explicit list of BC+ files to translate — excludes other projects (Clickson, CUT, TILT, etc.)
const BC_FILES = ['common']

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

async function translateFile(
  file: string,
  locale: string,
  glossary: string,
  client: Anthropic,
): Promise<void> {
  const frPath = join(TRANSLATIONS_DIR, 'fr', `${file}.json`)
  const targetPath = join(TRANSLATIONS_DIR, locale, `${file}.json`)

  if (!existsSync(frPath)) {
    console.warn(`  Skipping ${file}: fr/${file}.json not found`)
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

  const missing = getMissingKeys(frContent, targetContent)
  const missingCount = Object.keys(missing).length

  if (missingCount === 0) {
    console.log(`  ✓ ${locale}/${file}.json — nothing missing`)
    return
  }

  console.log(`  Translating ${missingCount} missing key(s) in ${locale}/${file}.json...`)

  const entries = Object.entries(missing)
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
  const fileArg = fileIdx !== -1 ? args[fileIdx + 1] : 'common'

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
  const filesToProcess = fileArg === 'all' ? BC_FILES : [fileArg]

  console.log('\nFetching glossary...')
  const glossary = await loadGlossary()

  for (const loc of localesToProcess) {
    console.log(`\nTranslating to: ${LOCALE_NAMES[loc]} (${loc})`)
    console.log(`Files: ${filesToProcess.join(', ')}`)

    for (const file of filesToProcess) {
      await translateFile(file, loc, glossary, client)
    }
  }

  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
