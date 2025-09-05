// src/lib/axes.ts
export type Axis = {
  key: string
  label: string
  pos: string // positive pole word
  neg: string // negative pole word
}

export const AXES: Axis[] = [
  { key: 'valence', label: 'Valence (positive ↔ negative)', pos: 'joyful', neg: 'miserable' },
  { key: 'arousal', label: 'Arousal (excited ↔ calm)', pos: 'electric', neg: 'serene' },
  { key: 'concrete', label: 'Concreteness (concrete ↔ abstract)', pos: 'hammer', neg: 'theory' },
  { key: 'formality', label: 'Formality (formal ↔ casual)', pos: 'formal', neg: 'casual' },
  { key: 'novelty', label: 'Novelty (novel ↔ cliché)', pos: 'novel', neg: 'cliche' },
  { key: 'trust', label: 'Trust (trustworthy ↔ sketchy)', pos: 'reliable', neg: 'sketchy' },
]