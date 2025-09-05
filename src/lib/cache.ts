// Shared cache for anchor embeddings
// This singleton pattern ensures we only compute anchor embeddings once
// and share them across all API routes

type AnchorCache = Record<string, number[]> | null

class AnchorEmbeddingsCache {
  private static instance: AnchorEmbeddingsCache
  private cache: AnchorCache = null
  private computePromise: Promise<Record<string, number[]>> | null = null

  private constructor() {}

  static getInstance(): AnchorEmbeddingsCache {
    if (!AnchorEmbeddingsCache.instance) {
      AnchorEmbeddingsCache.instance = new AnchorEmbeddingsCache()
    }
    return AnchorEmbeddingsCache.instance
  }

  async get(computeFn: () => Promise<Record<string, number[]>>): Promise<Record<string, number[]>> {
    // If cache exists, return it
    if (this.cache !== null) {
      return this.cache
    }

    // If computation is in progress, wait for it
    if (this.computePromise) {
      return this.computePromise
    }

    // Start new computation
    this.computePromise = computeFn()
    
    try {
      this.cache = await this.computePromise
      return this.cache
    } finally {
      this.computePromise = null
    }
  }

  // Optional: Clear cache if needed (e.g., for testing)
  clear(): void {
    this.cache = null
    this.computePromise = null
  }
}

export const anchorCache = AnchorEmbeddingsCache.getInstance()