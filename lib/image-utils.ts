type ValidateImageFileOptions = {
  allowedMimeTypes?: readonly string[]
  maxFileSize?: number
}

export type UploadedImage = {
  id: string
  file: File
  preview: string
  width: number
  height: number
  size: number
  name: string
  type: string
}

const DEFAULT_ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"] as const
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Attempts to parse a size string like "1024x1024" into width/height numbers.
 * Falls back to 1024x1024 when the input is invalid.
 */
export function parseImageSize(size?: string | null): { width: number; height: number } {
  if (!size) {
    return { width: 1024, height: 1024 }
  }

  const match = size.match(/(\d+)\s*x\s*(\d+)/i)
  if (!match) {
    return { width: 1024, height: 1024 }
  }

  const width = Number.parseInt(match[1], 10)
  const height = Number.parseInt(match[2], 10)

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 1024, height: 1024 }
  }

  return { width, height }
}

/**
 * Validates an image file against basic constraints (type, size).
 * Returns an error message when invalid, otherwise null.
 */
export function validateImageFile(file: File, options: ValidateImageFileOptions = {}): string | null {
  const allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES
  const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE

  if (!file.type || !allowedMimeTypes.includes(file.type as typeof allowedMimeTypes[number])) {
    return " PNGJPGWEBP "
  }

  if (file.size <= 0) {
    return ""
  }

  if (file.size > maxFileSize) {
    const sizeInMb = (maxFileSize / (1024 * 1024)).toFixed(0)
    return ` ${sizeInMb}MB`
  }

  return null
}

/**
 * Converts a File into an UploadedImage object with preview URL and dimensions.
 */
export async function processImageFile(file: File): Promise<UploadedImage> {
  const preview = URL.createObjectURL(file)

  try {
    const { width, height } = await getImageDimensions(preview)

    return {
      id: createImageId(),
      file,
      preview,
      width,
      height,
      size: file.size,
      name: file.name,
      type: file.type,
    }
  } catch {
    // In case dimension extraction fails we still return a usable object
    return {
      id: createImageId(),
      file,
      preview,
      width: 0,
      height: 0,
      size: file.size,
      name: file.name,
      type: file.type,
    }
  }
}

async function getImageDimensions(previewUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = (event) => {
      reject(event)
    }
    img.src = previewUrl
  })
}

function createImageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `img-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
