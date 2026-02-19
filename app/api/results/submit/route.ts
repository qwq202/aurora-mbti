import { NextRequest, NextResponse } from 'next/server'
import { appendResult, type MbtiTypeStr, type DimensionScore } from '@/lib/results-store'
import { generalRateLimit, getRateLimitKey } from '@/lib/rate-limit'

interface SubmitBody {
  result: {
    type: string
    scores: {
      EI: { winner: string; percent: number; percentFirst: number; percentSecond: number }
      SN: { winner: string; percent: number; percentFirst: number; percentSecond: number }
      TF: { winner: string; percent: number; percentFirst: number; percentSecond: number }
      JP: { winner: string; percent: number; percentFirst: number; percentSecond: number }
    }
  }
  profile?: {
    ageGroup?: string
    gender?: string
  } | null
  locale?: string
}

// 限流：复用 generalRateLimit，但使用独立 key
function submitRateLimit(request: NextRequest) {
  const key = getRateLimitKey(request, 'results-submit')
  // 直接调用 generalRateLimit 中间件
  return generalRateLimit(request)
}

export async function POST(request: NextRequest) {
  // 限流检查
  const rlDecision = submitRateLimit(request)
  if (rlDecision.action === 'block') {
    // 静默返回 200，不暴露限流信息
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  let body: SubmitBody
  try {
    body = await request.json() as SubmitBody
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  try {
    const { result, profile, locale = 'unknown' } = body
    if (!result?.type || !result?.scores) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const mbtiType = result.type as MbtiTypeStr

    // 从 percentFirst/percentSecond 换算成 winner + percent
    const buildScore = (dim: keyof typeof result.scores): DimensionScore => {
      const s = result.scores[dim]
      // winner 字段已存在时直接用，否则根据 percentFirst >= 50 推断
      const winner = s.winner ?? (s.percentFirst >= 50 ? dim[0] : dim[1])
      const percent = s.percent ?? (s.percentFirst >= 50 ? s.percentFirst : s.percentSecond)
      return { winner, percent }
    }

    await appendResult({
      timestamp: new Date().toISOString(),
      mbtiType,
      locale,
      scores: {
        EI: buildScore('EI'),
        SN: buildScore('SN'),
        TF: buildScore('TF'),
        JP: buildScore('JP'),
      },
      ageGroup: profile?.ageGroup ?? undefined,
      gender: profile?.gender ?? undefined,
    })
  } catch {
    // 静默处理，不暴露内部错误
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
