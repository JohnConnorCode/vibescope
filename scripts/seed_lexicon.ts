// scripts/seed_lexicon.ts
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import pLimit from 'p-limit'
import { createClient } from '@supabase/supabase-js'
import { embed } from '../src/lib/embeddings.js'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is required')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE) {
  console.error('❌ SUPABASE_SERVICE_ROLE is required')
  console.error('   Please add your Supabase service role key to .env.local')
  process.exit(1)
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required')
  console.error('   Please add your OpenAI API key to .env.local')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
const supabase = createClient(url, serviceKey)

async function main() {
  console.log('🌱 Starting lexicon seeding...')
  console.log(`📊 Using ${process.env.EMBEDDING_MODEL || 'text-embedding-3-large'} model`)
  
  const file = path.join(process.cwd(), 'data/lexicon.txt')
  
  if (!fs.existsSync(file)) {
    console.error(`❌ Lexicon file not found: ${file}`)
    process.exit(1)
  }
  
  const terms = fs.readFileSync(file, 'utf8').split('\n').map(s => s.trim()).filter(Boolean)
  console.log(`📝 Found ${terms.length} terms to process`)

  // Check if lexicon table exists and has the right structure
  const { data: existingTerms } = await supabase
    .from('lexicon')
    .select('term')
    .limit(1)
  
  if (!existingTerms) {
    console.error('❌ Lexicon table not found. Please run database migrations first.')
    process.exit(1)
  }

  const limit = pLimit(3) // Conservative rate limit for embeddings
  let done = 0
  let errors = 0
  
  console.log('⚡ Processing embeddings...')
  
  await Promise.all(terms.map(t => limit(async () => {
    try {
      // Check if term already exists
      const { data: existing } = await supabase
        .from('lexicon')
        .select('term')
        .eq('term', t)
        .maybeSingle()
      
      if (existing) {
        console.log(`⏭️  Skipping existing term: ${t}`)
        done += 1
        return
      }

      const e = await embed(t)
      const { error } = await supabase.from('lexicon').upsert({ 
        term: t, 
        embedding: e,
        frequency: 1.0, // Default frequency
        created_at: new Date().toISOString()
      })
      
      if (error) {
        console.error(`❌ Error seeding "${t}":`, error.message)
        errors += 1
      } else {
        done += 1
        if (done % 10 === 0) {
          console.log(`✅ Seeded ${done}/${terms.length} terms`)
        }
      }
    } catch (error) {
      console.error(`❌ Error processing "${t}":`, error)
      errors += 1
    }
  })))
  
  console.log('\n🎉 Seeding completed!')
  console.log(`✅ Successfully seeded: ${done} terms`)
  if (errors > 0) {
    console.log(`❌ Errors: ${errors} terms`)
  }
  console.log(`📈 Total processed: ${done + errors}/${terms.length}`)
}

main().catch(err => { 
  console.error('💥 Seeding failed:', err)
  process.exit(1) 
})