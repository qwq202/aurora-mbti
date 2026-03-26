import { NextRequest } from 'next/server'
import { readSettings } from './settings-store'
import { isAuthConfigured, isAuthAuthorized } from './auth'
import { apiError } from './api-response'
import { SECURITY_ERRORS } from './security'

/**
 * 匿名测试访问控制
 * 
 * 检查是否允许匿名用户进行测试：
 * - 如果 allowAnonymousTest 为 true，允许所有用户
 * - 如果 allowAnonymousTest 为 false，仅允许已认证的管理员
 */
export function isAnonymousTestAllowed(request: NextRequest): {
  allowed: boolean
  reason?: string
} {
  const settings = readSettings()
  
  // 如果允许匿名测试，直接放行
  if (settings.allowAnonymousTest) {
    return { allowed: true }
  }
  
  // 如果配置了管理员认证，检查是否为管理员
  if (isAuthConfigured() && isAuthAuthorized(request)) {
    return { allowed: true }
  }
  
  // 不允许匿名测试且未认证
  return {
    allowed: false,
    reason: '当前系统设置为仅允许管理员进行测试。请登录后重试。'
  }
}

/**
 * 匿名测试访问控制的中间件响应
 * 
 * 如果访问被拒绝，返回错误响应；否则返回 null
 */
export function checkAnonymousTestAccess(request: NextRequest): Response | null {
  const result = isAnonymousTestAllowed(request)
  
  if (result.allowed) {
    return null
  }
  
  return apiError('FORBIDDEN', result.reason || SECURITY_ERRORS.UNAUTHORIZED, 403)
}

/**
 * 检查请求是否来自已认证的管理员
 */
export function isAdminRequest(request: NextRequest): boolean {
  return isAuthConfigured() && isAuthAuthorized(request)
}