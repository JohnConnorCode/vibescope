// src/lib/embeddings.ts
import { AXES } from './axes'

export type Embedder = {
  embed: (text: string) => Promise<number[]>
}

let embedder: Embedder

async function initializeEmbedder() {
  // Read environment variables at runtime, not module load time
  // Clean up malformed env vars from Vercel (remove quotes, newlines, etc)
  const cleanEnv = (val: string | undefined, fallback: string) => {
    if (!val) return fallback
    return val.replace(/^["']|["']$/g, '').replace(/\\n/g, '').trim()
  }
  
  const provider = cleanEnv(process.env.PROVIDER, 'openai')
  const modelSpec = cleanEnv(process.env.EMBEDDING_MODEL, 'openai:text-embedding-3-large')
  
  if (provider === 'openai') {
    // npm i openai
    const OpenAI = (await import('openai')).default
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const model = modelSpec.split(':')[1]
    embedder = {
      embed: async (text: string) => {
        const res = await client.embeddings.create({ model, input: text })
        return res.data[0].embedding as number[]
      },
    }
  } else {
    // For now, only OpenAI is fully supported
    // Voyage can be added later with proper typing
    throw new Error('Currently only OpenAI provider is supported. Set PROVIDER=openai')
  }
}

export async function embed(text: string) {
  if (!embedder) {
    await initializeEmbedder()
  }
  return embedder.embed(text)
}

export async function axisScores(termEmbedding: number[], anchorEmbeds: Record<string, { pos: number[]; neg: number[] }>) {
  // cosine projection of (term ⋅ (pos-neg)) normalized
  const scores: Record<string, number> = {}
  for (const ax of AXES) {
    const pos = anchorEmbeds[ax.key].pos
    const neg = anchorEmbeds[ax.key].neg
    const diff = pos.map((v, i) => v - neg[i])
    const dot = termEmbedding.reduce((s, v, i) => s + v * diff[i], 0)
    const magTerm = Math.sqrt(termEmbedding.reduce((s, v) => s + v * v, 0))
    const magDiff = Math.sqrt(diff.reduce((s, v) => s + v * v, 0))
    const cos = dot / (magTerm * magDiff)
    scores[ax.key] = Math.max(-1, Math.min(1, cos))
  }
  return scores
}

export async function anchorEmbeddings() {
  const out: Record<string, { pos: number[]; neg: number[] }> = {}
  for (const ax of AXES) {
    const [pos, neg] = await Promise.all([embed(ax.pos), embed(ax.neg)])
    out[ax.key] = { pos, neg }
  }
  return out
}