import { readFileSync, writeFileSync } from 'node:fs'
import * as XLSX from 'xlsx'
import {
  ALL_SCORE_ITEM_CODES,
  isStandardItemScore,
  SCORE_ITEM_ALIASES,
  type ScoreItemCodeValue
} from '@shared/constants/score-items'
import { GRADE_LEVELS, type GradeLevel } from '@shared/constants/grade-level'
import { Gender, isGender, type ScoreItemRule, type ScoreRuleEntry } from '@shared/models'
import { parseTimeToSeconds } from '@shared/utils'

export const OFFICIAL_RULE_EXCEL_HEADERS = ['项目', '性别', '年级', '成绩', '得分'] as const

interface OfficialTableSection {
  readonly itemCode: ScoreItemCodeValue
  readonly dataStartRow: number
  readonly dataEndRow: number
  readonly performanceUnit: 'seconds' | 'centimeters' | 'count' | 'time'
}

const OFFICIAL_TABLE_SECTIONS: readonly OfficialTableSection[] = [
  { itemCode: 'run50', dataStartRow: 3, dataEndRow: 22, performanceUnit: 'seconds' },
  { itemCode: 'run800', dataStartRow: 28, dataEndRow: 50, performanceUnit: 'time' },
  { itemCode: 'sitReach', dataStartRow: 55, dataEndRow: 74, performanceUnit: 'centimeters' },
  { itemCode: 'standingJump', dataStartRow: 82, dataEndRow: 101, performanceUnit: 'centimeters' },
  { itemCode: 'sitUp', dataStartRow: 110, dataEndRow: 128, performanceUnit: 'count' }
]

const GRADE_GENDER_COLUMNS: Readonly<Record<GradeLevel, Readonly<Record<Gender, number>>>> = {
  初一: { [Gender.Male]: 2, [Gender.Female]: 3 },
  初二: { [Gender.Male]: 4, [Gender.Female]: 5 },
  初三: { [Gender.Male]: 6, [Gender.Female]: 7 }
}

function readSheetRows(filePath: string): string[][] {
  const buffer = readFileSync(filePath)
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return []
  }
  const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: ''
  }) as string[][]
  return rows.map((row) => row.map((cell) => String(cell ?? '').trim()))
}

function parsePerformanceValue(
  unit: OfficialTableSection['performanceUnit'],
  raw: string
): number | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (unit === 'time') {
    return parseTimeToSeconds(trimmed)
  }

  const normalized = trimmed.replace('：', ':')
  if (normalized.includes(':')) {
    const parts = normalized.split(':')
    if (parts.length === 2) {
      const minutes = Number(parts[0])
      const seconds = Number(parts[1])
      if (!Number.isNaN(minutes) && !Number.isNaN(seconds)) {
        return minutes * 60 + seconds
      }
    }
  }

  const num = Number(trimmed)
  return Number.isNaN(num) ? null : num
}

function formatPerformanceForRule(
  unit: OfficialTableSection['performanceUnit'],
  performance: number
): string {
  if (unit === 'time') {
    const minutes = Math.floor(performance / 60)
    const seconds = performance % 60
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`
  }
  return String(performance)
}

function resolveItemLabel(itemCode: ScoreItemCodeValue): string {
  return Object.entries(SCORE_ITEM_ALIASES).find(([, code]) => code === itemCode)?.[0] ?? itemCode
}

export function parseOfficialScoringTable(filePath: string): ScoreItemRule[] {
  const rows = readSheetRows(filePath)
  const items: ScoreItemRule[] = []

  for (const section of OFFICIAL_TABLE_SECTIONS) {
    for (const gradeLevel of GRADE_LEVELS) {
      for (const gender of [Gender.Male, Gender.Female]) {
        const columnIndex = GRADE_GENDER_COLUMNS[gradeLevel][gender]
        const entries: ScoreRuleEntry[] = []

        for (let rowIndex = section.dataStartRow; rowIndex <= section.dataEndRow; rowIndex += 1) {
          const row = rows[rowIndex]
          if (!row) {
            continue
          }

          const score = Number(row[1])
          const performanceRaw = row[columnIndex] ?? ''
          if (Number.isNaN(score) || performanceRaw.trim().length === 0) {
            continue
          }

          if (!isStandardItemScore(score)) {
            throw new Error(`评分表含非标准单项得分：${score}（第 ${rowIndex + 1} 行）`)
          }

          const performance = parsePerformanceValue(section.performanceUnit, performanceRaw)
          if (performance === null || Number.isNaN(performance)) {
            continue
          }

          entries.push({ performance, score })
        }

        if (entries.length > 0) {
          items.push({
            itemCode: section.itemCode,
            gender,
            gradeLevel,
            entries: entries.sort((a, b) => a.performance - b.performance)
          })
        }
      }
    }
  }

  return items
}

export function writeOfficialRuleExcel(filePath: string, items: readonly ScoreItemRule[]): void {
  const headerRow = [...OFFICIAL_RULE_EXCEL_HEADERS]
  const dataRows = items.flatMap((item) =>
    item.entries.map((entry) => [
      resolveItemLabel(item.itemCode),
      item.gender,
      item.gradeLevel,
      formatPerformanceForRule(
        OFFICIAL_TABLE_SECTIONS.find((section) => section.itemCode === item.itemCode)?.performanceUnit ??
          'seconds',
        entry.performance
      ),
      String(entry.score)
    ])
  )

  const sheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '评分标准')
  writeFileSync(filePath, XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

export function importOfficialScoringTable(sourcePath: string, targetRulePath: string): ScoreItemRule[] {
  const items = parseOfficialScoringTable(sourcePath)
  writeOfficialRuleExcel(targetRulePath, items)
  return items
}

export function countRuleEntries(items: readonly ScoreItemRule[]): number {
  return items.reduce((sum, item) => sum + item.entries.length, 0)
}

export function assertOfficialTableCoverage(items: readonly ScoreItemRule[]): void {
  for (const gradeLevel of GRADE_LEVELS) {
    for (const gender of [Gender.Male, Gender.Female]) {
      for (const itemCode of ALL_SCORE_ITEM_CODES) {
        const found = items.find(
          (item) =>
            item.itemCode === itemCode && item.gender === gender && item.gradeLevel === gradeLevel
        )
        if (!found || found.entries.length < 10) {
          throw new Error(`评分表缺少完整档位：${itemCode} ${gender} ${gradeLevel}`)
        }
      }
    }
  }
}

export function parseGradeLevel(raw: string): GradeLevel | null {
  const normalized = raw.trim()
  return GRADE_LEVELS.includes(normalized as GradeLevel) ? (normalized as GradeLevel) : null
}

export function parseRuleGender(raw: string): Gender | null {
  return isGender(raw) ? raw : null
}
