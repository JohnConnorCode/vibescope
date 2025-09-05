// src/lib/axes.ts
export type Axis = {
  key: string
  label: string
  pos: string // positive pole word
  neg: string // negative pole word
}

export const AXES: Axis[] = [
  { key: 'masculine_feminine', label: 'Gender (masculine ↔ feminine)', pos: 'masculine', neg: 'feminine' },
  { key: 'concrete_abstract', label: 'Tangibility (concrete ↔ abstract)', pos: 'concrete', neg: 'abstract' },
  { key: 'active_passive', label: 'Energy (active ↔ passive)', pos: 'active', neg: 'passive' },
  { key: 'positive_negative', label: 'Valence (positive ↔ negative)', pos: 'positive', neg: 'negative' },
  { key: 'serious_playful', label: 'Tone (serious ↔ playful)', pos: 'serious', neg: 'playful' },
  { key: 'complex_simple', label: 'Complexity (complex ↔ simple)', pos: 'complex', neg: 'simple' },
  { key: 'intense_mild', label: 'Intensity (intense ↔ mild)', pos: 'intense', neg: 'mild' },
  { key: 'natural_artificial', label: 'Origin (natural ↔ artificial)', pos: 'natural', neg: 'artificial' },
  { key: 'private_public', label: 'Visibility (private ↔ public)', pos: 'private', neg: 'public' },
  { key: 'high_status_low_status', label: 'Status (high-status ↔ low-status)', pos: 'high-status', neg: 'low-status' },
  { key: 'ordered_chaotic', label: 'Structure (ordered ↔ chaotic)', pos: 'ordered', neg: 'chaotic' },
  { key: 'future_past', label: 'Time (future ↔ past)', pos: 'future', neg: 'past' },
]