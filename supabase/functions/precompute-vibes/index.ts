// supabase/functions/precompute-vibes/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get popular terms without embeddings
    const { data: popularTerms } = await supabase
      .from('lexicon')
      .select('term')
      .order('freq', { ascending: false })
      .is('embedding', null)
      .limit(100)

    if (!popularTerms || popularTerms.length === 0) {
      return new Response(JSON.stringify({ message: 'No terms to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Batch process embeddings
    const batchSize = 10
    let processed = 0

    for (let i = 0; i < popularTerms.length; i += batchSize) {
      const batch = popularTerms.slice(i, i + batchSize)
      const terms = batch.map(t => t.term)

      // Get embeddings from OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-large',
          input: terms
        })
      })

      if (!embeddingResponse.ok) {
        console.error('OpenAI API error:', await embeddingResponse.text())
        continue
      }

      const embeddingData = await embeddingResponse.json()
      
      // Store embeddings
      for (let j = 0; j < terms.length; j++) {
        const embedding = embeddingData.data[j].embedding
        await supabase
          .from('lexicon')
          .update({ embedding })
          .eq('term', terms[j])
        processed++
      }
    }

    // Precompute anchor embeddings
    const anchorTerms = [
      'joyful', 'miserable', 'electric', 'serene', 
      'hammer', 'theory', 'formal', 'casual',
      'novel', 'cliche', 'reliable', 'sketchy'
    ]

    const anchorResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
        input: anchorTerms
      })
    })

    if (anchorResponse.ok) {
      const anchorData = await anchorResponse.json()
      // Store in a dedicated anchor cache table (you'd need to create this)
      for (let i = 0; i < anchorTerms.length; i++) {
        await supabase
          .from('anchor_cache')
          .upsert({
            term: anchorTerms[i],
            embedding: anchorData.data[i].embedding,
            computed_at: new Date().toISOString()
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Precomputation complete', 
        processed,
        anchorsUpdated: anchorResponse.ok 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})