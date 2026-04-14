#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const APPSCRIPT_DIR = resolve(__dirname, 'appscript')
const ENV_PATH = resolve(ROOT, '.env')

function run(cmd, cwd = APPSCRIPT_DIR, quiet = false) {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      cwd,
      stdio: quiet ? 'pipe' : ['inherit', 'pipe', 'pipe'],
    }).trim()
  } catch (err) {
    if (err.stdout) return err.stdout.trim()
    throw err
  }
}

function runInteractive(cmd, cwd = APPSCRIPT_DIR) {
  execSync(cmd, { cwd, stdio: 'inherit' })
}

function log(msg) {
  console.log(`\n> ${msg}`)
}

async function main() {
  console.log('=========================================')
  console.log('  kanoony Cost Calculator - Sheet Setup')
  console.log('=========================================')

  // 1. Ensure clasp is available
  log('Checking for clasp...')
  try {
    run('npx @google/clasp --version', ROOT, true)
    console.log('  OK - clasp found')
  } catch {
    console.log('  Installing @google/clasp...')
    runInteractive('npm install --save-dev @google/clasp', ROOT)
  }

  // 2. Login
  log('Checking Google login status...')
  try {
    const status = run('npx @google/clasp login --status', ROOT, true)
    if (status.includes('Not logged in')) throw new Error('not logged in')
    console.log('  OK - already logged in')
  } catch {
    console.log('  Opening browser for Google login...')
    runInteractive('npx @google/clasp login', ROOT)
  }

  // 3. Create project (skip if .clasp.json already exists)
  const claspJson = resolve(APPSCRIPT_DIR, '.clasp.json')
  if (!existsSync(claspJson)) {
    log('Creating Apps Script project...')
    run(
      `npx @google/clasp create --title "kanoony Cost Calculator" --type standalone --rootDir "${APPSCRIPT_DIR}"`,
      ROOT,
    )
    console.log('  OK - project created')
  } else {
    log('Apps Script project already exists, skipping create.')
  }

  // 4. Push code
  log('Pushing code to Apps Script...')
  run('npx @google/clasp push --force')
  console.log('  OK - code pushed')

  // 5. Deploy
  log('Deploying web app...')
  const deployOutput = run('npx @google/clasp deploy --description "v1"')

  const match = deployOutput.match(/(AKfycb[\w_-]+)/)
  if (!match) {
    console.error('\nFailed to extract deployment ID from output:')
    console.error(deployOutput)
    console.error('\nOpening script in browser so you can deploy manually...')
    try { run('npx @google/clasp open', APPSCRIPT_DIR, true) } catch {}
    console.error('In the browser: Deploy > New deployment > Web app > Anyone > Deploy')
    console.error('Then paste the URL into .env as VITE_APPS_SCRIPT_URL=<url>')
    process.exit(1)
  }

  const deployId = match[1]
  const url = `https://script.google.com/macros/s/${deployId}/exec`

  // 6. Write .env
  writeFileSync(ENV_PATH, `VITE_APPS_SCRIPT_URL=${url}\n`)

  console.log('\n=========================================')
  console.log('  Setup complete!')
  console.log(`  Web App URL: ${url}`)
  console.log('  Saved to .env')
  console.log('=========================================')
  console.log('')
  console.log('IMPORTANT: First-time authorization required.')
  console.log('  1. Run:  npx @google/clasp open')
  console.log('  2. In the editor, click Run > testSetup')
  console.log('  3. Click "Review Permissions" and authorize')
  console.log('  4. Done! Submissions will now save to your sheet.')
  console.log('')
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message)
  process.exit(1)
})

