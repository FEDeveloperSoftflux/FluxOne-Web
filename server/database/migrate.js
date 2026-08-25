import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool, query } from '../src/config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, 'migrations')

async function migrate() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    console.log(`Running ${file}`)
    await query(sql)
  }

  await pool.end()
  console.log('Migrations complete')
}

migrate().catch(async (error) => {
  console.error(error)
  await pool.end()
  process.exit(1)
})
