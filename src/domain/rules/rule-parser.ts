import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import {
  ALL_SCORE_ITEM_CODES,
  LEGACY_RULE_EXCEL_HEADERS,
  resolveScoreItemCode,
  RULE_EXCEL_HEADERS,
  type ScoreItemCodeValue
} from '@shared/constants/score-items'
import { GRADE_LEVELS, type GradeLevel } from '@shared/constants/grade-level'
import { Gender, isGender, type RuleValidationIssue, type ScoreRuleManifest, type ScoreRuleObject } from '@shared/models'
import { parseTimeToSeconds } from '@shared/utils'
import type { ScoreItemRule, ScoreRuleEntry } from '@shared/models/score-rule'
import { parseGradeLevel } from '@infrastructure/excel/official-scoring-table-parser'

const MANIFEST_FILE = 'manifest.json'
const RULE_FILE = 'rule.xlsx'

export function parseManifest(content: string): ScoreRuleManifest {
  const parsed = JSON.parse(content) as ScoreRuleManifest
  return parsed
}

function parsePerformanceValue(itemCode: ScoreItemCodeValue, raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (itemCode === 'run800') {
    const seconds = parseTimeToSeconds(trimmed)
    if (seconds !== null) {
      return seconds
    }
  }

  const num = Number(trimmed)
  return Number.isNaN(num) ? null : num
}

function readRuleRows(ruleFilePath: string): string[][] {
  const buffer = readFileSync(ruleFilePath)
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

function readRuleHeaders(ruleFilePath: string): readonly string[] {
  if (!existsSync(ruleFilePath)) {
    return []
  }

  const rows = readRuleRows(ruleFilePath)
  return (rows[0] ?? []).map((header) => header.trim())
}

export function ruleFileHasGradeColumn(ruleFilePath: string): boolean {
  return readRuleHeaders(ruleFilePath).includes('年级')
}

function detectRuleFormat(headers: readonly string[]): 'official' | 'legacy' {
  if (RULE_EXCEL_HEADERS.every((header) => headers.includes(header))) {
    return 'official'
  }
  if (LEGACY_RULE_EXCEL_HEADERS.every((header) => headers.includes(header))) {
    return 'legacy'
  }
  return 'official'
}

export function parseRuleExcel(ruleFilePath: string): {
  items: ScoreItemRule[]
  issues: RuleValidationIssue[]
} {
  const rows = readRuleRows(ruleFilePath)
  const issues: RuleValidationIssue[] = []
  const items: ScoreItemRule[] = []

  if (rows.length === 0) {
    issues.push({ rowIndex: 0, message: '评分标准 Excel 为空' })
    return { items, issues }
  }

  const headers = rows[0].map((h) => h.trim())
  const format = detectRuleFormat(headers)
  const requiredHeaders = format === 'legacy' ? LEGACY_RULE_EXCEL_HEADERS : RULE_EXCEL_HEADERS

  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      issues.push({ rowIndex: 1, message: `缺少列：${required}` })
    }
  }

  if (issues.length > 0) {
    return { items, issues }
  }

  const colIndex = (name: string): number => headers.indexOf(name)
  const hasGradeColumn = format === 'official'

  rows.slice(1).forEach((row, index) => {
    const rowIndex = index + 2
    if (row.every((cell) => cell.trim().length === 0)) {
      return
    }

    const projectName = row[colIndex('项目')] ?? ''
    const genderRaw = row[colIndex('性别')] ?? ''
    const gradeRaw = hasGradeColumn ? row[colIndex('年级')] ?? '' : '初二'
    const performanceRaw = row[colIndex('成绩')] ?? ''
    const scoreRaw = row[colIndex('得分')] ?? ''

    const itemCode = resolveScoreItemCode(projectName)
    if (!itemCode) {
      issues.push({ rowIndex, message: `未知项目：${projectName}` })
      return
    }

    if (!isGender(genderRaw)) {
      issues.push({ rowIndex, message: `性别非法：${genderRaw}` })
      return
    }

    const gradeLevel = parseGradeLevel(gradeRaw)
    if (!gradeLevel) {
      issues.push({ rowIndex, message: `年级非法：${gradeRaw}` })
      return
    }

    const performance = parsePerformanceValue(itemCode, performanceRaw)
    if (performance === null) {
      issues.push({ rowIndex, message: `成绩格式错误：${performanceRaw}` })
      return
    }

    const score = Number(scoreRaw)
    if (Number.isNaN(score)) {
      issues.push({ rowIndex, message: `得分格式错误：${scoreRaw}` })
      return
    }

    items.push({
      itemCode,
      gender: genderRaw,
      gradeLevel,
      entries: [{ performance, score }]
    })
  })

  return { items: mergeItemRules(items), issues }
}

function mergeItemRules(partial: ScoreItemRule[]): ScoreItemRule[] {
  const map = new Map<string, ScoreRuleEntry[]>()

  for (const item of partial) {
    const key = `${item.itemCode}::${item.gender}::${item.gradeLevel}`
    const existing = map.get(key) ?? []
    existing.push(...item.entries)
    map.set(key, existing)
  }

  return Array.from(map.entries()).map(([key, entries]) => {
    const [itemCode, gender, gradeLevel] = key.split('::') as [ScoreItemCodeValue, Gender, GradeLevel]
    return {
      itemCode,
      gender,
      gradeLevel,
      entries: entries.sort((a, b) => a.performance - b.performance)
    }
  })
}

export function validateRuleStructure(
  manifest: ScoreRuleManifest,
  items: readonly ScoreItemRule[]
): RuleValidationIssue[] {
  const issues: RuleValidationIssue[] = []
  const gradeLevels = Array.from(new Set(items.map((item) => item.gradeLevel)))
  const levelsToCheck = gradeLevels.length > 0 ? gradeLevels : [...GRADE_LEVELS]

  for (const gradeLevel of levelsToCheck) {
    for (const gender of [Gender.Male, Gender.Female]) {
      for (const itemCode of ALL_SCORE_ITEM_CODES) {
        const found = items.some(
          (item) =>
            item.itemCode === itemCode && item.gender === gender && item.gradeLevel === gradeLevel
        )
        if (!found) {
          issues.push({
            rowIndex: 0,
            message: `缺少项目规则：${itemCode}（${gender} ${gradeLevel}）`
          })
        }
      }
    }
  }

  for (const item of items) {
    if (item.entries.length === 0) {
      issues.push({
        rowIndex: 0,
        message: `项目 ${item.itemCode}（${item.gender} ${item.gradeLevel}）无评分条目`
      })
    }

    const performanceSet = new Set<number>()
    for (const entry of item.entries) {
      if (performanceSet.has(entry.performance)) {
        issues.push({
          rowIndex: 0,
          message: `重复成绩：${item.itemCode}（${item.gender} ${item.gradeLevel}）${entry.performance}`
        })
      }
      performanceSet.add(entry.performance)
    }
  }

  if (!manifest.supportedItems.every((code) => ALL_SCORE_ITEM_CODES.includes(code))) {
    issues.push({ rowIndex: 0, message: 'manifest.supportedItems 包含未知项目编码' })
  }

  return issues
}

export function loadScoreRulePlugin(pluginPath: string): {
  rule?: ScoreRuleObject
  issues: RuleValidationIssue[]
} {
  const manifestPath = join(pluginPath, MANIFEST_FILE)
  const rulePath = join(pluginPath, RULE_FILE)
  const issues: RuleValidationIssue[] = []

  let manifest: ScoreRuleManifest
  try {
    manifest = parseManifest(readFileSync(manifestPath, 'utf-8'))
  } catch {
    issues.push({ rowIndex: 0, message: 'manifest.json 无法读取或解析' })
    return { issues }
  }

  const parsed = parseRuleExcel(rulePath)
  issues.push(...parsed.issues)

  const structureIssues = validateRuleStructure(manifest, parsed.items)
  issues.push(...structureIssues)

  if (issues.length > 0) {
    return { issues }
  }

  return {
    rule: {
      manifest,
      pluginPath,
      items: parsed.items
    },
    issues: []
  }
}

export { MANIFEST_FILE, RULE_FILE }
