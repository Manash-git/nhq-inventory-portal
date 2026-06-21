/**
 * Seed Script - Import Excel data into Supabase from command line
 * 
 * Usage:
 *   Set environment variables first, then run:
 *   set VITE_SUPABASE_URL=https://your-project.supabase.co
 *   set VITE_SUPABASE_ANON_KEY=your-anon-key
 *   node scripts/seed-from-excel.js
 * 
 * OR simply use the Import button on the Home page (easier).
 */

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  console.error('')
  console.error('  Windows PowerShell:')
  console.error('    $env:VITE_SUPABASE_URL="https://xxx.supabase.co"')
  console.error('    $env:VITE_SUPABASE_ANON_KEY="eyJ..."')
  console.error('')
  console.error('  Windows CMD:')
  console.error('    set VITE_SUPABASE_URL=https://xxx.supabase.co')
  console.error('    set VITE_SUPABASE_ANON_KEY=eyJ...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Look for Excel file in parent directory or current directory
const possiblePaths = [
  path.resolve(__dirname, '..', '..', 'Veritas_Inventory_Merged.xlsx'),
  path.resolve(__dirname, '..', 'Veritas_Inventory_Merged.xlsx'),
  path.resolve(process.cwd(), 'Veritas_Inventory_Merged.xlsx'),
]

let excelPath = null
for (const p of possiblePaths) {
  if (fs.existsSync(p)) { excelPath = p; break }
}

if (!excelPath) {
  console.error('Error: Could not find Veritas_Inventory_Merged.xlsx')
  console.error('Place the Excel file in the project root or pass the path:')
  console.error('  node scripts/seed-from-excel.js /path/to/file.xlsx')
  process.exit(1)
}

async function seed() {
  console.log(`Reading: ${excelPath}`)
  const wb = XLSX.readFile(excelPath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws)

  console.log(`Found ${rows.length} rows to process.\n`)

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const product_description = row['Product Description']
    const part_number = row['Part Number (PN)']
    const category = row['Category'] || 'Other'
    const quantity = parseInt(row['Quantity']) || 0

    if (!product_description || !part_number) {
      skipped++
      continue
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        product_description: String(product_description).trim(),
        part_number: String(part_number).trim(),
        category: String(category).trim(),
        quantity,
        image_url: null
      }])
      .select()

    if (error) {
      console.error(`  Error: "${product_description}" - ${error.message}`)
      skipped++
    } else {
      console.log(`  Imported: ${product_description}`)
      await supabase.from('activity_logs').insert([{
        product_id: data[0].id,
        action: 'add',
        description: `Imported "${product_description}" from Excel seed script`,
        user_id: null,
        user_name: 'System'
      }])
      imported++
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
