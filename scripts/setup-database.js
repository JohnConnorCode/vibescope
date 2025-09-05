// scripts/setup-database.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://swgqbjubarqpsdiubdnv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z3FianViYXJxcHNkaXViZG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTcwNjEsImV4cCI6MjA3MjYzMzA2MX0.CUyp7HHbUwfsCM47S2uiLIGnnlLClKFw2Uzund15_k4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSQL() {
  try {
    console.log('Setting up VibeScope database...')
    
    // Read SQL files
    const createTables = fs.readFileSync(path.join(__dirname, '../sql/create_tables.sql'), 'utf8')
    const v2Schema = fs.readFileSync(path.join(__dirname, '../sql/v2_schema.sql'), 'utf8')
    const v3Schema = fs.readFileSync(path.join(__dirname, '../sql/v3_schema.sql'), 'utf8')
    
    console.log('\n⚠️  IMPORTANT: You need to run these SQL commands in your Supabase dashboard:')
    console.log('Go to: https://supabase.com/dashboard/project/swgqbjubarqpsdiubdnv/sql/new')
    console.log('\nRun these commands one by one:\n')
    
    console.log('-- Step 1: Enable pgvector extension')
    console.log('CREATE EXTENSION IF NOT EXISTS vector;\n')
    
    console.log('-- Step 2: Run create_tables.sql')
    console.log('/* Copy everything from sql/create_tables.sql */\n')
    
    console.log('-- Step 3: Run v2_schema.sql')
    console.log('/* Copy everything from sql/v2_schema.sql */\n')
    
    console.log('-- Step 4: Run v3_schema.sql')
    console.log('/* Copy everything from sql/v3_schema.sql */\n')
    
    console.log('✅ After running these, your database will be ready!')
    console.log('\nDirect link to SQL editor:')
    console.log('https://supabase.com/dashboard/project/swgqbjubarqpsdiubdnv/sql/new')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

runSQL()