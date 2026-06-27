import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import { USER_DATA_SUBDIRS, type UserDataSubdir } from '@shared/constants'
import type { AppPaths } from '@shared/types'

let initialized = false

export function getUserDataRoot(): string {
  return app.getPath('userData')
}

export function resolveAppPaths(): AppPaths {
  const userData = getUserDataRoot()
  return {
    userData,
    config: join(userData, 'config'),
    logs: join(userData, 'logs'),
    cache: join(userData, 'cache'),
    autosave: join(userData, 'autosave'),
    scoreRules: join(userData, 'score-rules')
  }
}

export function getPathForSubdir(subdir: UserDataSubdir): string {
  return join(getUserDataRoot(), subdir)
}

export async function ensureUserDataDirectories(): Promise<AppPaths> {
  const paths = resolveAppPaths()
  await Promise.all(USER_DATA_SUBDIRS.map((dir) => mkdir(getPathForSubdir(dir), { recursive: true })))
  initialized = true
  return paths
}

export function isAppInitialized(): boolean {
  return initialized
}

export function markAppInitialized(): void {
  initialized = true
}
