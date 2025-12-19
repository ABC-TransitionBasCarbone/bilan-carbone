import fs from 'fs'

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
