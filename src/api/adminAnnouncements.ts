import { apiRequest } from './client'

export type AnnouncementStatus = 'draft' | 'published'
export type AnnouncementPlatform = 'wechat' | 'bytedance'

export interface AnnouncementImage {
  readonly fileId: string
  readonly objectKey: string
  readonly url: string
  readonly alt: string
}

export interface AnnouncementInput {
  readonly title: string
  readonly contentHtml: string
  readonly images: readonly AnnouncementImage[]
  readonly status: AnnouncementStatus
  readonly platforms: readonly AnnouncementPlatform[]
  readonly sortOrder: number
  readonly autoPopup: boolean
  readonly startsAt: number
  readonly endsAt: number
}

export interface Announcement extends AnnouncementInput {
  readonly id: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly createdBy: string
  readonly updatedBy: string
}

export interface AnnouncementListItem {
  readonly id: string
  readonly title: string
  readonly status: AnnouncementStatus
  readonly platforms: readonly AnnouncementPlatform[]
  readonly sortOrder: number
  readonly autoPopup: boolean
  readonly startsAt: number
  readonly endsAt: number
  readonly imageCount: number
  readonly createdAt: number
  readonly updatedAt: number
}

export interface AnnouncementQuery {
  readonly page?: number
  readonly pageSize?: number
  readonly status?: AnnouncementStatus
  readonly platform?: AnnouncementPlatform
  readonly keyword?: string
}

export interface UploadedFile {
  readonly fileId: string
  readonly objectKey: string
  readonly url: string
  readonly originalName: string
  readonly contentType: string
  readonly sizeBytes: number
}

export function listAnnouncements(query: AnnouncementQuery = {}): Promise<{
  readonly items: readonly AnnouncementListItem[]
  readonly page: number
  readonly pageSize: number
  readonly total: number
}> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return apiRequest(`/admin/v1/announcements${suffix}`)
}

export function getAnnouncement(id: string): Promise<Announcement> {
  return apiRequest(`/admin/v1/announcements/${encodeURIComponent(id)}`)
}

export function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  return apiRequest('/admin/v1/announcements', { method: 'POST', body: input })
}

export function updateAnnouncement(id: string, input: AnnouncementInput): Promise<Announcement> {
  return apiRequest(`/admin/v1/announcements/${encodeURIComponent(id)}`, { method: 'PUT', body: input })
}

export function deleteAnnouncement(id: string): Promise<{ readonly deleted: true; readonly id: string }> {
  return apiRequest(`/admin/v1/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest('/admin/v1/files/upload', { method: 'POST', body: form })
}
