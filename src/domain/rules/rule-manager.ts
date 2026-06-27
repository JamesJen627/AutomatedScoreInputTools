import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { ScoreRuleObject, ScoreRulePluginInfo } from '@shared/models'
import { loadScoreRulePlugin, MANIFEST_FILE, parseManifest, RULE_FILE, ruleFileHasGradeColumn } from './rule-parser'

function comparePluginVersions(left: string, right: string): number {
  const leftParts = left.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const rightParts = right.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
    if (diff !== 0) {
      return diff
    }
  }

  return 0
}

function readPluginVersion(pluginPath: string): string | null {
  const manifestPath = join(pluginPath, MANIFEST_FILE)
  if (!existsSync(manifestPath)) {
    return null
  }

  try {
    const manifest = parseManifest(readFileSync(manifestPath, 'utf-8'))
    return manifest.version
  } catch {
    return null
  }
}

export class RuleManager {
  private activeRule: ScoreRuleObject | null = null
  private activePluginId: string | null = null

  listPlugins(basePath: string): ScoreRulePluginInfo[] {
    if (!existsSync(basePath)) {
      return []
    }

    return readdirSync(basePath)
      .map((entry) => join(basePath, entry))
      .filter((path) => statSync(path).isDirectory())
      .map((pluginPath) => this.describePlugin(pluginPath))
  }

  describePlugin(pluginPath: string): ScoreRulePluginInfo {
    const manifestPath = join(pluginPath, MANIFEST_FILE)
    const rulePath = join(pluginPath, RULE_FILE)

    if (!existsSync(manifestPath) || !existsSync(rulePath)) {
      return {
        id: pluginPath,
        name: '无效插件',
        version: '-',
        pluginPath,
        isActive: false,
        isValid: false,
        errorMessage: '缺少 manifest.json 或 rule.xlsx'
      }
    }

    try {
      const manifest = parseManifest(readFileSync(manifestPath, 'utf-8'))
      const loaded = loadScoreRulePlugin(pluginPath)
      return {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        pluginPath,
        isActive: this.activePluginId === manifest.id,
        isValid: loaded.rule !== undefined,
        errorMessage: loaded.issues[0]?.message
      }
    } catch {
      return {
        id: pluginPath,
        name: '无效插件',
        version: '-',
        pluginPath,
        isActive: false,
        isValid: false,
        errorMessage: 'manifest.json 解析失败'
      }
    }
  }

  loadPlugin(pluginPath: string): ScoreRuleObject {
    const loaded = loadScoreRulePlugin(pluginPath)
    if (!loaded.rule) {
      const message = loaded.issues.map((issue) => issue.message).join('；')
      throw new Error(message || '评分标准加载失败')
    }
    return loaded.rule
  }

  activatePlugin(pluginPath: string): ScoreRuleObject {
    const rule = this.loadPlugin(pluginPath)
    this.activeRule = rule
    this.activePluginId = rule.manifest.id
    return rule
  }

  getActiveRule(): ScoreRuleObject | null {
    return this.activeRule
  }

  getActivePluginId(): string | null {
    return this.activePluginId
  }

  ensureDefaultPlugins(bundledPath: string, userPath: string): void {
    mkdirSync(userPath, { recursive: true })

    if (!existsSync(bundledPath)) {
      return
    }

    for (const entry of readdirSync(bundledPath)) {
      const source = join(bundledPath, entry)
      if (!statSync(source).isDirectory()) {
        continue
      }
      const target = join(userPath, entry)
      if (!existsSync(target)) {
        cpSync(source, target, { recursive: true })
        continue
      }

      const bundledVersion = readPluginVersion(source)
      const installedVersion = readPluginVersion(target)
      const bundledRulePath = join(source, RULE_FILE)
      const installedRulePath = join(target, RULE_FILE)
      const needsGradeUpgrade =
        ruleFileHasGradeColumn(bundledRulePath) && !ruleFileHasGradeColumn(installedRulePath)
      if (
        needsGradeUpgrade ||
        (bundledVersion !== null &&
          (installedVersion === null || comparePluginVersions(bundledVersion, installedVersion) > 0))
      ) {
        cpSync(source, target, { recursive: true, force: true })
      }
    }
  }

  autoActivateFirstValid(basePath: string): ScoreRuleObject | null {
    const plugins = this.listPlugins(basePath).filter((plugin) => plugin.isValid)
    if (plugins.length === 0) {
      return null
    }
    return this.activatePlugin(plugins[0].pluginPath)
  }
}

export const ruleManager = new RuleManager()
