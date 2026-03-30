export function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor(ms / (1000 * 60 * 60))

  const pad = (num: number): string => String(num).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${minutes}:${pad(seconds)}`
}

export function parseTimeString(timeString: string): number | null {
  const parts = timeString.split(':').map(Number)

  if (parts.some(isNaN)) {
    return null
  }

  let ms = 0
  if (parts.length === 2) {
    const [minutes, seconds] = parts
    ms = (minutes * 60 + seconds) * 1000
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    ms = (hours * 3600 + minutes * 60 + seconds) * 1000
  } else {
    return null
  }

  return ms >= 0 ? ms : null
}

export function createProgressBar(current: number, total: number, length: number = 20): string {
  const progress = Math.min(current / total, 1)
  const filledLength = Math.round(length * progress)
  const emptyLength = length - filledLength

  const filled = '▓'.repeat(filledLength)
  const empty = '░'.repeat(emptyLength)

  return `${filled}${empty}`
}
