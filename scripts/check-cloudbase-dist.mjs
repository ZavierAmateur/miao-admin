import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd, stdout } from 'node:process'
import { loadEnv } from 'vite'

const distDirectory = resolve('dist')
const productionEnv = loadEnv('production', cwd(), '')
const files = await listFiles(distDirectory)
const indexPath = resolve(distDirectory, 'index.html')

if (productionEnv.VITE_APP_ENV !== 'production') {
  throw new Error('CloudBase 构建必须使用 VITE_APP_ENV=production')
}

if (productionEnv.VITE_ADMIN_API_BASE_URL?.trim()) {
  throw new Error('CloudBase 生产构建必须使用同源 /admin/v1，不能配置独立 API Base URL')
}

if (!files.includes(indexPath)) {
  throw new Error('CloudBase 构建产物缺少 dist/index.html')
}

const textFiles = files.filter((file) => /\.(?:css|html|js|json)$/u.test(file))
const contents = await Promise.all(textFiles.map((file) => readFile(file, 'utf8')))
const bundle = contents.join('\n')
const forbiddenValues = [
  'sh.run.tcloudbase.com',
  'ADMIN_BOOTSTRAP_PASSWORD',
  'APP_SECRET',
  'CLOUDBASE_API_KEY',
  'VITE_ADMIN_PROXY_TARGET',
]

for (const value of forbiddenValues) {
  if (bundle.includes(value)) {
    throw new Error(`CloudBase 构建产物包含禁止内容：${value}`)
  }
}

if (!bundle.includes('/admin/v1/')) {
  throw new Error('CloudBase 构建产物未保留同源 /admin/v1 管理接口路径')
}

const sourceMaps = files.filter((file) => file.endsWith('.map'))
if (sourceMaps.length > 0) {
  throw new Error(`CloudBase 构建产物不应包含 Source Map：${sourceMaps.join(', ')}`)
}

const totalBytes = (await Promise.all(files.map(async (file) => (await stat(file)).size)))
  .reduce((sum, size) => sum + size, 0)

stdout.write(`${JSON.stringify({
  status: 'ok',
  files: files.length,
  totalBytes,
  environment: productionEnv.VITE_APP_ENV,
  sameOriginAdminApi: true,
  sourceMaps: 0,
})}\n`)

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  }))
  return nested.flat().sort()
}
