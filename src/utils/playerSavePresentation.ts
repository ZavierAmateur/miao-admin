export interface PlayerSaveFieldRow {
  readonly key: string
  readonly label: string
  readonly value: unknown
  readonly displayValue: string
  readonly core: boolean
}

const CORE_FIELDS = new Set([
  'level',
  'levelMaxProgress',
  'gold',
  'star',
  'energy',
  'energyInfinite',
  'undoCount',
  'refreshCount',
  'bombCount',
  'animals',
  'sevenSignProgress',
  'sevenSignTodayState',
])

const FIELD_LABELS: Readonly<Record<string, string>> = {
  level: '当前关卡',
  levelMaxProgress: '最高关卡进度',
  gold: '金币',
  star: '星星',
  energy: '体力',
  energyInfinite: '无限体力状态',
  undoCount: '撤销道具',
  refreshCount: '刷新道具',
  bombCount: '炸弹道具',
  animals: '已获得动物',
  sevenSignProgress: '七日签到进度',
  sevenSignTodayState: '今日签到状态',
  saveTime: '本地保存时间',
  winnerStreakCount: '连胜次数',
  todaySuccessCount: '今日成功次数',
  todayVideoForEnergyCount: '今日体力视频次数',
  refreshAnimalId: '刷新动物 ID',
  todayAnimalId: '今日动物 ID',
  subscribeStae: '订阅状态',
  adFreeCount: '免广告次数',
  energyTimer: '体力计时值',
  totalRechargeAmount: '累计充值金额',
  totalGoodBuyCounts: '商品累计购买次数',
  todayGoodBuyCounts: '商品今日购买次数',
  todayGoodsBuyTime: '商品今日购买时间',
  firstSevenAwardGot: '首轮七日奖励状态',
  myMiniProgramDaily: '我的小程序每日状态',
  desktopDaily: '桌面入口每日状态',
  todayAdReliveCount: '今日广告复活次数',
}

const FIELD_ORDER = new Map(Object.keys(FIELD_LABELS).map((key, index) => [key, index]))

export function buildPlayerSaveRows(user: Readonly<Record<string, unknown>>): readonly PlayerSaveFieldRow[] {
  return Object.entries(user)
    .sort(([left], [right]) => (FIELD_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER) - (FIELD_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER)
      || left.localeCompare(right))
    .map(([key, value]) => ({
      key,
      label: FIELD_LABELS[key] ?? key,
      value,
      displayValue: formatPlayerSaveValue(key, value),
      core: CORE_FIELDS.has(key),
    }))
}

export function formatPlayerSaveValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'saveTime' && typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'medium' }).format(value)
  }
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('zh-CN') : String(value)
  if (Array.isArray(value)) return value.length === 0 ? '暂无' : JSON.stringify(value)
  if (typeof value === 'object') {
    return Object.keys(value).length === 0 ? '暂无' : JSON.stringify(value)
  }
  return String(value)
}

export function stringifyPlayerSave(user: Readonly<Record<string, unknown>>): string {
  return JSON.stringify(user, null, 2)
}
