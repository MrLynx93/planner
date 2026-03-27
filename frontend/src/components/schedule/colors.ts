interface BlockColor {
  bg: string
  border: string
  text: string
}

const PALETTE: BlockColor[] = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }, // blue
  { bg: '#dcfce7', border: '#22c55e', text: '#166534' }, // green
  { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' }, // purple
  { bg: '#ffedd5', border: '#f97316', text: '#9a3412' }, // orange
  { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' }, // pink
  { bg: '#fef9c3', border: '#eab308', text: '#854d0e' }, // yellow
  { bg: '#cffafe', border: '#06b6d4', text: '#155e75' }, // cyan
  { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }, // red
]

export function getColorForId(id: number): BlockColor {
  return PALETTE[id % PALETTE.length]
}
