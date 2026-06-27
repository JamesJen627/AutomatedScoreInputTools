/** Application-wide constants. Business data must not be hardcoded here. */

export const APP_NAME = 'Automated Score Input Tools' as const
export const APP_NAME_ZH = '体育成绩自动评分系统' as const
export const APP_VERSION = '1.0.0' as const

export const USER_DATA_SUBDIRS = [
  'config',
  'logs',
  'cache',
  'autosave',
  'score-rules'
] as const

export type UserDataSubdir = (typeof USER_DATA_SUBDIRS)[number]
