// src/lib/embeddings.ts
import { AXES } from './axes'

export type Embedder = {
  embed: (text: string) => Promise<number[]>
}

const provider = process.env.PROVIDER || 'openai'
const modelSpec = process.env.EMBEDDING_MODEL || 'openai:text-embedding-3-large'
const dim = Number(process.env.EMBEDDING_DIM || '3072')

let embedder: Embedder

async function initializeEmbedder() {
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
  } else if (provider === 'voyage') {
    // npm i voyageai
    const { VoyageAI } = await import('voyageai')
    const client = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY })
    const model = modelSpec.split(':')[1]
    embedder = {
      embed: async (text: string) => {
        const res = await client.embed({ model, input: [text], inputType: 'document', outputDimension: dim })
        return res.data[0].embedding as number[]
      },
    }
  } else {
    throw new Error('Unsupported PROVIDER')
  }
}

export async function embed(text: string) {
  if (!embedder) await initializeEmbedder()
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