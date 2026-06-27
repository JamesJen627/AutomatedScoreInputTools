/**
 * 800m 时间格式解析 — PRD §3.9 / §2.4.
 * 输入：mm'ss''（支持中文引号自动转换）
 * 输出：总秒数
 */
export function normalizeTimeQuotes(value: string): string {
  return value
    .trim()
    .replace(/[''′]/g, "'")
    .replace(/[""″]/g, '"')
}

const TIME_PATTERN = /^(\d{1,2})'(\d{1,2})"$/

export function parseTimeToSeconds(value: string): number | null {
  const normalized = normalizeTimeQuotes(value)
  const match = TIME_PATTERN.exec(normalized)
  if (!match) {
    return null
  }

  const minutes = Number.parseInt(match[1], 10)
  const seconds = Number.parseInt(match[2], 10)

  if (Number.isNaN(minutes) || Number.isNaN(seconds) || seconds >= 60) {
    return null
  }

  return minutes * 60 + seconds
}

export function formatSecondsToTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`
}
