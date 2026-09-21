import { describe, expect, it, vi } from 'vitest'
import { executeFormatCommand, executeTextColorCommand } from './richTextCommands'

describe('richTextCommands', () => {
  it('允许对同一选区依次叠加粗体和下划线', () => {
    const execute = vi.fn().mockReturnValue(true)

    executeFormatCommand(execute, 'bold')
    executeFormatCommand(execute, 'underline')

    expect(execute.mock.calls).toEqual([
      ['bold', false, undefined],
      ['underline', false, undefined],
    ])
  })

  it('使用 CSS span 方式为局部文字设置颜色', () => {
    const execute = vi.fn().mockReturnValue(true)

    executeTextColorCommand(execute, '#f56c6c')

    expect(execute.mock.calls).toEqual([
      ['styleWithCSS', false, 'true'],
      ['foreColor', false, '#f56c6c'],
      ['styleWithCSS', false, 'false'],
    ])
  })
})
