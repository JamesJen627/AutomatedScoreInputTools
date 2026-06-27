import { join } from 'node:path'
import { app } from 'electron'
import { compareCalculationReports, scoringEngine } from '@domain/scoring'
import { ruleManager } from '@domain/rules'
import type { CalculationReport, Student } from '@shared/models'

export function getBundledScoreRulesPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'ScoreRules')
  }
  return join(app.getAppPath(), 'ScoreRules')
}

export function initializeScoreRules(userScoreRulesPath: string): void {
  ruleManager.ensureDefaultPlugins(getBundledScoreRulesPath(), userScoreRulesPath)
  ruleManager.autoActivateFirstValid(userScoreRulesPath)
}

export function listScoreRulePlugins(userScoreRulesPath: string) {
  return ruleManager.listPlugins(userScoreRulesPath)
}

export function activateScoreRule(pluginPath: string) {
  return ruleManager.activatePlugin(pluginPath)
}

export function getActiveScoreRule() {
  return ruleManager.getActiveRule()
}

export function runCalculation(students: readonly Student[]): {
  report: CalculationReport
  auditPassed: boolean
} {
  const rule = ruleManager.getActiveRule()
  if (!rule) {
    throw new Error('未加载评分标准，请先导入或激活评分标准。')
  }

  const first = scoringEngine.calculateBatch(students, rule)
  const second = scoringEngine.calculateBatch(students, rule)
  const auditPassed = compareCalculationReports(first, second)

  return { report: first, auditPassed }
}
