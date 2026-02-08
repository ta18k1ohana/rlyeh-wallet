export const ROLE_PREFERENCE_OPTIONS = [
  { value: 'pl_main', label: 'PLメイン' },
  { value: 'gm_main', label: 'GMメイン' },
  { value: 'both', label: '両方' },
] as const

export const SCENARIO_TENDENCY_TAGS = [
  'クラシック',
  'コメディ',
  '秘匿HO',
  'PVP',
  'エモ',
  '高ロスト',
  '恋愛・うちよそ',
  'ホラー',
  '1-2PL',
  'シティ',
  '3PL以上',
  '友情',
  '恋愛',
  'バディ',
  'NL',
  'BL',
  'GL',
] as const

export const PLAY_STYLE_OPTIONS = [
  '推理',
  '戦闘',
  '茶番',
  'RP',
  '感情表現',
  'CS練り',
] as const

export function getRolePreferenceLabel(value: string | null): string {
  if (!value) return '未設定'
  const option = ROLE_PREFERENCE_OPTIONS.find((o) => o.value === value)
  return option?.label ?? '未設定'
}
