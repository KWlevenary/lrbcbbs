/**
 * Cloudinary 图床封装
 * 只暴露：
 *   uploadToCloudinary(file, options) —— 上传，返回 { url, publicId, width, height, bytes, format }
 *   isCloudinaryUrl(url)              —— 判断是否 Cloudinary URL
 *   extractPublicId(url)              —— 从 URL 提取 public_id
 */

const CLOUD_NAME = 'osdae2bq'
const UPLOAD_PRESET = 'lrbcbbs'

/**
 * 上传图片到 Cloudinary
 * @param {File|Blob} file
 * @param {Object} options
 *   - folder: 上传到指定文件夹，默认 'lrbcbbs'
 *   - transformation: Cloudinary 上传时转换字符串（可选）
 * @returns {Promise<{url:string, publicId:string, width:number, height:number, bytes:number, format:string}>}
 */
export async function uploadToCloudinary(file, options) {
  if (options == null) options = {}

  const folder = options.folder || 'lrbcbbs'
  const url = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  if (options.transformation) {
    formData.append('transformation', options.transformation)
  }

  const res = await fetch(url, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    let errMsg = 'Cloudinary 上传失败（HTTP ' + res.status + '）'
    try {
      const errJson = await res.json()
      if (errJson && errJson.error && errJson.error.message) {
        errMsg = errJson.error.message
      }
    } catch (e) {}
    throw new Error(errMsg)
  }

  const data = await res.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
    format: data.format
  }
}

/**
 * 判断一个 URL 是不是 Cloudinary 的
 */
export function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.indexOf('res.cloudinary.com') !== -1
}

/**
 * 从 Cloudinary URL 提取 public_id
 * 例：https://res.cloudinary.com/osdae2bq/image/upload/v123/lrbcbbs/posts/abc.webp
 * 返回：lrbcbbs/posts/abc
 */
export function extractPublicId(url) {
  if (!isCloudinaryUrl(url)) return null
  const marker = '/image/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  let rest = url.slice(idx + marker.length)
  if (rest.charAt(0) === 'v') {
    const slash = rest.indexOf('/')
    if (slash !== -1) rest = rest.slice(slash + 1)
  }
  const dot = rest.lastIndexOf('.')
  if (dot !== -1) rest = rest.slice(0, dot)
  return rest
}