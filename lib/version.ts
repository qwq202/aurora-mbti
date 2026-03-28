export const CURRENT_VERSION = '1.0.0'

export const GITHUB_REPO = 'qwq202/Aurora-MBTI'

export const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`

export type VersionInfo = {
  current: string
  latest: string | null
  hasUpdate: boolean
  releaseUrl: string | null
  checkedAt: string | null
}

export type GitHubRelease = {
  tag_name: string
  name: string
  html_url: string
  published_at: string
  body: string
}

export function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) => {
    const parts = v.replace(/^v/, '').split('.').map(Number)
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
  }
  
  const aParts = parseVersion(a)
  const bParts = parseVersion(b)
  
  for (let i = 0; i < 3; i++) {
    if (aParts[i] > bParts[i]) return 1
    if (aParts[i] < bParts[i]) return -1
  }
  return 0
}