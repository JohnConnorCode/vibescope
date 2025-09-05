// scripts/seed_lexicon.ts
import fs from 'node:fs'
import path from 'node:path'
import pLimit from 'p-limit'
import { createClient } from '@supabase/supabase-js'
import { embed } from '../src/lib/embeddings'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
const supabase = createClient(url, serviceKey)

async function main() {
  const file = path.join(process.cwd(), 'data/lexicon.txt')
  const terms = fs.readFileSync(file, 'utf8').split('\n').map(s => s.trim()).filter(Boolean)

  const limit = pLimit(5) // tune for your rate limits
  let done = 0
  await Promise.all(terms.map(t => limit(async () => {
    const e = await embed(t)
    await supabase.from('lexicon').upsert({ term: t, embedding: e })
    done += 1
    if (done % 100 === 0) console.log('seeded', done)
  })))
  console.log('completed', done)
}

main().catch(err => { console.error(err); process.exit(1) })