import fs from 'fs'
import path from 'path'
import { Rule } from 'publicodes'
import yargs from 'yargs'

export type TranslationKey = 'titre' | 'description' | 'question' | 'unité'
export type TranslationRecord = Record<string, any>

export const KEYS_TO_TRANSLATE: TranslationKey[] = ['titre', 'description', 'question', 'unité']
export const TRANSLATIONS_DIR = path.join(__dirname, '../translations')

export const TO_TRANSLATE_PREFIX = '[TO_TRANSLATE]'
export const UPDATED_PREFIX = '[UPDATED]'

export const AVAILABLE_LOCALES = ['en', 'es'] as const
export type Locale = (typeof AVAILABLE_LOCALES)[number] | 'fr'

export const AVAILABLE_MODELS = ['cut'] as const
export type Model = (typeof AVAILABLE_MODELS)[number]

const MODEL_PACKAGES: Record<Model, string> = {
  cut: '@abc-transitionbascarbone/publicodes-count/publicodes-build/publicodes-count.model.json',
}

// Helper to load publicodes rules from a given model
export async function loadRulesForModel(model: Model): Promise<Record<string, Rule>> {
  const packageName = MODEL_PACKAGES[model]
  const module = await import(packageName)
  return module.default
}

// Helper to read json file (or create it if it doesn't exist)
export function readJSONFile(filePath: string): Record<string, unknown> | undefined {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File does not exist, create an empty object
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2), 'utf-8')
      return {}
    } else {
      // Other errors
      console.error(`Error reading JSON file at ${filePath}:`, error)
      return
    }
  }
}

// Helper to write json file
export function writeJSONFile(filePath: string, data: Record<string, unknown>): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`Error writing JSON file at ${filePath}:`, error)
  }
}

export function loadTranslation(locale: Locale, model: Model): TranslationRecord {
  return readJSONFile(path.join(TRANSLATIONS_DIR, locale, `${model}/publicodes-rules.json`)) ?? {}
}

export function saveTranslation(locale: Locale, model: Model, data: TranslationRecord): void {
  writeJSONFile(path.join(TRANSLATIONS_DIR, locale, `${model}/publicodes-rules.json`), data)
}

// Helper to check for arguments within script
export function getArgs() {
  const args = yargs(process.argv.slice(2))
    .version(false)
    .usage('Translate publicodes rules\n\nUsage: $0 [options]')
    .option('model', {
      alias: 'm',
      type: 'string',
      choices: AVAILABLE_MODELS,
      describe: `The source model to be translated.`,
    })
    .option('target', {
      alias: 't',
      type: 'string',
      choices: AVAILABLE_LOCALES,
      describe: 'The target language to translate into.',
    })
    .demandOption(['m'])
    .help('h')
    .alias('h', 'help')
    .parseSync()

  const destLang = args.target

  if (destLang && !AVAILABLE_LOCALES.includes(destLang as (typeof AVAILABLE_LOCALES)[number])) {
    console.error(`ERROR: the language '${destLang}' is not supported.`)
    process.exit(-1)
  }

  return {
    ...args,
    destLang: !destLang ? AVAILABLE_LOCALES : [destLang],
  }
}
