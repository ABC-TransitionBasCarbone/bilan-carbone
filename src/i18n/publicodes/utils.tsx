import fs from 'fs'
import path from 'path'
import prettier from 'prettier'
import { Rule } from 'publicodes'
import yargs from 'yargs'

export type TranslationKey = 'titre' | 'description' | 'question' | 'unité' | 'options'
export interface TranslationRecord {
  [key: string]: string | TranslationRecord | Record<string, string>
}

export const KEYS_TO_TRANSLATE: TranslationKey[] = ['titre', 'description', 'question', 'unité']
export const TRANSLATIONS_DIR = path.join(__dirname, '../translations')

export const TO_TRANSLATE_PREFIX = '[TO_TRANSLATE]'
export const UPDATED_PREFIX = '[UPDATED]'

export const AVAILABLE_LOCALES = ['en', 'es'] as const
export type Locale = (typeof AVAILABLE_LOCALES)[number] | 'fr'

export const AVAILABLE_MODELS = ['cut', 'clickson'] as const
export type Model = (typeof AVAILABLE_MODELS)[number]

const MODEL_PACKAGES: Record<Model, string> = {
  cut:
    process.env.NODE_ENV === 'production'
      ? '@abc-transitionbascarbone/publicodes-count/publicodes-build/publicodes-count.model.json'
      : path.join(
          __dirname,
          '../../../publicodes-packages/publicodes-count/publicodes-build/publicodes-count.model.json',
        ),
  clickson:
    process.env.NODE_ENV === 'production'
      ? '@abc-transitionbascarbone/publicodes-clickson/publicodes-build/publicodes-clickson.model.json'
      : path.join(
          __dirname,
          '../../../publicodes-packages/publicodes-clickson/publicodes-build/publicodes-clickson.model.json',
        ),
}

// Helper to load publicodes rules from a given model
export async function loadRulesForModel(model: Model): Promise<Record<string, Rule>> {
  const packageName = MODEL_PACKAGES[model]
  const packageModule = await import(packageName)
  return packageModule.default
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
export async function writeJSONFile(filePath: string, data: Record<string, unknown>): Promise<void> {
  try {
    const config = await prettier.resolveConfig(filePath, { editorconfig: true })
    const formatted = await prettier.format(JSON.stringify(data), {
      ...config,
      filepath: filePath,
      plugins: [],
      printWidth: 1,
    })
    fs.writeFileSync(filePath, formatted, 'utf-8')
  } catch (error) {
    console.error(`Error writing JSON file at ${filePath}:`, error)
  }
}

export function loadTranslation(locale: Locale, model: Model): TranslationRecord {
  return (readJSONFile(path.join(TRANSLATIONS_DIR, locale, `publicodes/${model}-rules.json`)) ??
    {}) as TranslationRecord
}

export async function saveTranslation(locale: Locale, model: Model, data: TranslationRecord): Promise<void> {
  await writeJSONFile(path.join(TRANSLATIONS_DIR, locale, `publicodes/${model}-rules.json`), data)
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
