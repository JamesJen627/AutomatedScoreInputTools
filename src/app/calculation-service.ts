import { dialog } from 'electron'
import { basename, dirname } from 'node:path'
import { auditCalculationReports } from '@domain/audit'
import { scoringEngine } from '@domain/scoring'
import { ruleManager } from '@domain/rules'
import {
  buildDefaultExportFileName,
  buildExportRows,
  writeExportWorkbook,
  type ExportResult
} from '@infrastructure/excel'
import type { AuditReport, CalculationReport, Student } from '@shared/models'

export interface CalculationRunOutput {
  readonly report: CalculationReport
  readonly auditReport: AuditReport
  readonly auditPassed: boolean
}

export function runCalculation(students: readonly Student[]): CalculationRunOutput {
  const rule = ruleManager.getActiveRule()
  if (!rule) {
    throw new Error('未加载评分标准，请先导入或激活评分标准。')
  }

  const first = scoringEngine.calculateBatch(students, rule)
  const second = scoringEngine.calculateBatch(students, rule)
  const auditReport = auditCalculationReports(first, second)

  return {
    report: first,
    auditReport,
    auditPassed: auditReport.auditPassed
  }
}

export interface ExportExcelInput {
  readonly gridRows: readonly (readonly string[])[]
  readonly calculationReport: CalculationReport
  readonly sourceFileName: string
  readonly sourceFilePath: string
  readonly auditPassed: boolean
}

export async function exportExcelWithDialog(input: ExportExcelInput): Promise<ExportResult | null> {
  if (!input.auditPassed) {
    throw new Error('审核未通过，禁止导出。')
  }

  if (input.calculationReport.failedCount > 0) {
    throw new Error('存在计算失败的学生，禁止导出。')
  }

  const defaultDirectory = dirname(input.sourceFilePath)
  const defaultFileName = buildDefaultExportFileName(input.sourceFileName)

  const saveResult = await dialog.showSaveDialog({
    title: '导出成绩 Excel',
    defaultPath: `${defaultDirectory}\\${defaultFileName}`,
    filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
  })

  if (saveResult.canceled || !saveResult.filePath) {
    return null
  }

  const rows = buildExportRows({
    gridRows: input.gridRows,
    calculationReport: input.calculationReport
  })
  writeExportWorkbook(saveResult.filePath, rows)

  return {
    success: true,
    filePath: saveResult.filePath,
    fileName: basename(saveResult.filePath),
    rowCount: rows.length - 1
  }
}
