import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localUploadsDir = path.resolve(__dirname, '../../uploads')

const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function fileFilter(_req, file, cb) {
  if (!allowedMimes.has(file.mimetype)) {
    cb(new Error('Only JPEG, PNG, or WebP images are allowed'))
    return
  }
  cb(null, true)
}

function storage() {
  if (isCloudinaryConfigured()) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'fluxone',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      },
    })
  }

  // Local disk fallback — ensures file.path is set so controllers can read it.
  if (!fs.existsSync(localUploadsDir)) {
    fs.mkdirSync(localUploadsDir, { recursive: true })
  }

  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, localUploadsDir)
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
    },
  })
}

export const upload = multer({
  storage: storage(),
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 },
})
