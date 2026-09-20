import { describe, expect, it } from 'vitest'
import { buildPlayerSaveRows, formatPlayerSaveValue, stringifyPlayerSave } from './playerSavePresentation'

describe('playerSavePresentation', () => {
  it('把核心存档字段转换为中文展示项并保持固定顺序', () => {
    const rows = buildPlayerSaveRows({ gold: 1280, level: 6, custom: '保留值', animals: [] })

    expect(rows.map((item) => item.key)).toEqual(['level', 'gold', 'animals', 'custom'])
    expect(rows[0]).toMatchObject({ label: '当前关卡', displayValue: '6', core: true })
    expect(rows[1]).toMatchObject({ label: '金币', displayValue: '1,280', core: true })
    expect(rows[2]).toMatchObject({ label: '已获得动物', displayValue: '暂无', core: true })
    expect(rows[3]).toMatchObject({ label: 'custom', displayValue: '保留值', core: false })
  })

  it('格式化布尔值、对象和空值且保留原始 JSON', () => {
    expect(formatPlayerSaveValue('energyInfinite', true)).toBe('是')
    expect(formatPlayerSaveValue('todayGoodBuyCounts', { 1: 2 })).toBe('{"1":2}')
    expect(formatPlayerSaveValue('unknown', null)).toBe('—')
    expect(stringifyPlayerSave({ level: 3 })).toBe('{\n  "level": 3\n}')
  })
})
