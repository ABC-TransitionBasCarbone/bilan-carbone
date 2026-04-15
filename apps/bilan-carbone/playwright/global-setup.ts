import { execSync } from 'node:child_process'

export default async function globalSetup() {
  if (process.env.SKIP_DB_RESET === 'true') {
    return
  }
  const env = { ...process.env }
  delete env['CLAUDECODE']
  execSync('yarn db:test:reset', { stdio: 'inherit', env, cwd: process.cwd() })
}
