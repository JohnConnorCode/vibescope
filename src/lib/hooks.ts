// src/lib/hooks.ts
import { useState, useEffect, useCallback, useRef } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }

  return [storedValue, setValue] as const
}

export function useVibeHistory() {
  const [history, setHistory] = useLocalStorage<Array<{
    term: string
    timestamp: number
    axes?: Record<string, number>
  }>>('vibe-history', [])

  const addToHistory = useCallback((term: string, axes?: Record<string, number>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.term !== term).slice(0, 19)
      return [{ term, timestamp: Date.now(), axes }, ...filtered]
    })
  }, [setHistory])

  return { history, addToHistory }
}

export function useVibeFavorites() {
  const [favorites, setFavorites] = useLocalStorage<Array<{
    term: string
    axes: Record<string, number>
    narrative?: string
  }>>('vibe-favorites', [])

  const addFavorite = useCallback((term: string, axes: Record<string, number>, narrative?: string) => {
    setFavorites(prev => {
      if (prev.some(f => f.term === term)) return prev
      return [...prev, { term, axes, narrative }]
    })
  }, [setFavorites])

  const removeFavorite = useCallback((term: string) => {
    setFavorites(prev => prev.filter(f => f.term !== term))
  }, [setFavorites])

  const isFavorite = useCallback((term: string) => {
    return favorites.some(f => f.term === term)
  }, [favorites])

  return { favorites, addFavorite, removeFavorite, isFavorite }
}