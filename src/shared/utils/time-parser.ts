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

/** 50m 秒数格式 — 支持 7.56 与计时器常见写法 8"7（8.7 秒） */
const RUN50_DECIMAL_PATTERN = /^\d+(\.\d+)?$/
const RUN50_QUOTE_PATTERN = /^(\d+)"(\d+)$/

function normalizeRun50Quotes(value: string): string {
  return value.trim().replace(/[""″]/g, '"')
}

export function parseRun50Seconds(value: string): number | null {
  const trimmed = normalizeRun50Quotes(value)
  if (trimmed.length === 0) {
    return null
  }

  if (RUN50_DECIMAL_PATTERN.test(trimmed)) {
    const seconds = Number(trimmed)
    return Number.isNaN(seconds) ? null : seconds
  }

  const quoteMatch = RUN50_QUOTE_PATTERN.exec(trimmed)
  if (!quoteMatch) {
    return null
  }

  const wholeSeconds = Number.parseInt(quoteMatch[1], 10)
  const fractionDigits = quoteMatch[2]
  const fraction = Number.parseInt(fractionDigits, 10) / Math.pow(10, fractionDigits.length)

  if (Number.isNaN(wholeSeconds) || Number.isNaN(fraction)) {
    return null
  }

  return wholeSeconds + fraction
}
