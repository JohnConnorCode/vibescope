// src/lib/narration.ts
import OpenAI from 'openai'
import { AXES } from './axes'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function generateVibeNarrative(
  term: string,
  axes: Record<string, number>,
  neighbors: Array<{ term: string; distance: number }>
): Promise<string> {
  try {
    // Find strongest positive and negative axes
    const sortedAxes = Object.entries(axes).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    const strongestPositive = sortedAxes.find(([_, v]) => v > 0.3)
    const strongestNegative = sortedAxes.find(([_, v]) => v < -0.3)
    
    // Get closest neighbors
    const closest = neighbors.slice(0, 3).map(n => n.term)
    
    const prompt = `Write a 1-2 sentence vibe interpretation for the word "${term}".
    
    Data:
    - Strongest positive trait: ${strongestPositive ? `${strongestPositive[0]} (${strongestPositive[1].toFixed(2)})` : 'none'}
    - Strongest negative trait: ${strongestNegative ? `${strongestNegative[0]} (${strongestNegative[1].toFixed(2)})` : 'none'}
    - Semantic neighbors: ${closest.join(', ')}
    
    Style: Poetic but precise. Reference the data naturally. Max 40 words.`

    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano', // Using GPT-5 nano for ultra-fast narrations
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 60
    })

    return response.choices[0].message.content || `"${term}" has a unique vibe that defies simple description.`
  } catch (error) {
    console.error('Narration error:', error)
    return `"${term}" resonates with its own distinct energy.`
  }
}

export async function compareVibesNarrative(
  terms: string[],
  axesData: Record<string, Record<string, number>>,
  distance: number
): Promise<string> {
  try {
    const prompt = `Compare the vibes of: ${terms.join(' vs ')}.
    
    Vibe distance: ${distance.toFixed(2)} (0=identical, 2=opposite)
    
    Write 1-2 sentences about their relationship. Max 40 words.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 60
    })

    return response.choices[0].message.content || `These terms dance in different dimensions of meaning.`
  } catch (error) {
    console.error('Comparison narration error:', error)
    return `An interesting contrast in semantic space.`
  }
}