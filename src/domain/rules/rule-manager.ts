import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { ScoreRuleObject, ScoreRulePluginInfo } from '@shared/models'
import { loadScoreRulePlugin, MANIFEST_FILE, parseManifest, RULE_FILE } from './rule-parser'

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
