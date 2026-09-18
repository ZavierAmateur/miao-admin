export interface ApiSuccess<T> {
  readonly code: 0
  readonly msg: 'ok'
  readonly timestamp: number
  readonly requestId: string
  readonly data: T
}

export interface ApiFailure {
  readonly code: string
  readonly msg: string
  readonly timestamp: number
  readonly requestId: string
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string

  constructor(
    status: number,
    code: string,
    message: string,
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}
