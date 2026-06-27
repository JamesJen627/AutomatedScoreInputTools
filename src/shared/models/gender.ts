/** Student gender — PRD allows 男 / 女 only. */

export enum Gender {
  Male = '男',
  Female = '女'
}

export const GENDER_VALUES: readonly Gender[] = [Gender.Male, Gender.Female]

export function isGender(value: string): value is Gender {
  return value === Gender.Male || value === Gender.Female
}
