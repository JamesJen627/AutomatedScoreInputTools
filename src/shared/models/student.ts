/** Internal student record — PRD §5.5. */

import type { Gender } from './gender'

export interface Student {
  readonly rowIndex: number
  readonly className: string
  readonly examNumber: string
  readonly studentNumber: string
  readonly name: string
  readonly gender: Gender
  /** 坐位体前屈，单位：厘米 */
  readonly sitReach: number
  readonly sitReachWeight: number
  /** 800m，内部存储：秒 */
  readonly run800: number
  readonly run800Weight: number
  /** 50m，单位：秒 */
  readonly run50: number
  readonly run50Weight: number
  /** 立定跳远，单位：米 */
  readonly standingJump: number
  readonly standingJumpWeight: number
  /** 仰卧起坐，单位：次（整数） */
  readonly sitUp: number
  readonly sitUpWeight: number
}

export interface StudentFieldKey {
  readonly key: keyof Omit<Student, 'rowIndex'>
  readonly excelHeader: string
}
