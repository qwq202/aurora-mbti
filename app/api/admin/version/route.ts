import { NextRequest } from 'next/server'
import { isAuthAuthorized, isAuthConfigured } from '@/lib/auth'
import { apiError, apiOk } from '@/lib/api-response'
import { CURRENT_VERSION, GITHUB_REPO, compareVersions, type GitHubRelease, type VersionInfo } from '@/lib/version'

const VERSION_CACHE_DURATION = 60 * 60 * 1000 // 1 小时

let cachedVersionInfo: { data: VersionInfo; timestamp: number } | null = null

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return apiError('NOT_CONFIGURED', 'Admin credentials not configured.', 503)
  }
  if (!isAuthAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const forceRefresh = request.nextUrl.searchParams.get('force') === 'true'
  
  // 检查缓存
  if (!forceRefresh && cachedVersionInfo && Date.now() - cachedVersionInfo.timestamp < VERSION_CACHE_DURATION) {
    return apiOk(cachedVersionInfo.data)
  }

  try {
    const latestVersion = await fetchLatestVersion()
    
    const versionInfo: VersionInfo = {
      current: CURRENT_VERSION,
      latest: latestVersion?.tag_name || null,
      hasUpdate: latestVersion ? compareVersions(latestVersion.tag_name, CURRENT_VERSION) > 0 : false,
      releaseUrl: latestVersion?.html_url || null,
      checkedAt: new Date().toISOString(),
    }

    // 更新缓存
    cachedVersionInfo = {
      data: versionInfo,
      timestamp: Date.now(),
    }

    return apiOk(versionInfo)
  } catch (error) {
    console.error('Failed to check version:', error)
    
    // 返回当前版本，不显示更新提示
    return apiOk({
      current: CURRENT_VERSION,
      latest: null,
      hasUpdate: false,
      releaseUrl: null,
      checkedAt: new Date().toISOString(),
    } as VersionInfo)
  }
}

async function fetchLatestVersion(): Promise<GitHubRelease | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Aurora-MBTI-Admin',
      },
      next: { revalidate: 3600 }, // 缓存 1 小时
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log('No releases found for this repository')
      } else if (response.status === 403) {
        console.warn('GitHub API rate limit exceeded')
      }
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch latest version:', error)
    return null
  }
}