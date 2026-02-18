import { apiError } from '@/lib/api-response'

export async function POST() {
  return apiError(
    'DEPRECATED',
    'Deprecated endpoint. Use /api/admin/login with admin token.',
    410
  )
}
