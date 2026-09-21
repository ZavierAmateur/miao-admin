import { describe, expect, it, vi } from 'vitest'
import { createAnnouncement, deleteAnnouncement, listAnnouncements, uploadFile } from './adminAnnouncements'

const success = (data: unknown) => new Response(JSON.stringify({
  code: 0, msg: 'ok', timestamp: 1, requestId: 'response-request', data,
}), { status: 200, headers: { 'content-type': 'application/json' } })

describe('adminAnnouncements', () => {
  it('序列化公告分页筛选并保持独立列表接口', async () => {
    const fetchMock = vi.fn().mockResolvedValue(success({ items: [], page: 2, pageSize: 20, total: 0 }))
    vi.stubGlobal('fetch', fetchMock)

    await listAnnouncements({ page: 2, pageSize: 20, status: 'published', platform: 'wechat', keyword: '旅行' })

    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe('/admin/v1/announcements?page=2&pageSize=20&status=published&platform=wechat&keyword=%E6%97%85%E8%A1%8C')
  })

  it('新增公告使用 JSON，删除公告使用独立 DELETE', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(success({ id: 'announcement-1' })))
    vi.stubGlobal('fetch', fetchMock)
    const input = {
      title: '旅行公告', contentHtml: '<p>正文</p>', images: [], status: 'draft' as const,
      platforms: ['wechat'] as const, sortOrder: 0, autoPopup: false, startsAt: 0, endsAt: 0,
    }

    await createAnnouncement(input)
    await deleteAnnouncement('announcement/1')

    const [createUrl, createOptions] = fetchMock.mock.calls[0]!
    expect(createUrl).toBe('/admin/v1/announcements')
    expect(createOptions.method).toBe('POST')
    expect((createOptions.headers as Headers).get('content-type')).toBe('application/json')
    expect(JSON.parse(createOptions.body as string)).toMatchObject({ title: '旅行公告', images: [] })
    const [deleteUrl, deleteOptions] = fetchMock.mock.calls[1]!
    expect(deleteUrl).toBe('/admin/v1/announcements/announcement%2F1')
    expect(deleteOptions.method).toBe('DELETE')
  })

  it('通用文件上传使用 FormData 且不手动设置 Content-Type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(success({ fileId: 'file-1' }))
    vi.stubGlobal('fetch', fetchMock)
    const file = new File([new Uint8Array([1, 2, 3])], 'poster.png', { type: 'image/png' })

    await uploadFile(file)

    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe('/admin/v1/files/upload')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect((options.headers as Headers).has('content-type')).toBe(false)
  })
})
