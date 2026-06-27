import { join } from 'node:path'
import { app } from 'electron'
import { ruleManager } from '@domain/rules'

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
