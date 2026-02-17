import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthorized, isAdminConfigured } from '@/lib/admin-auth'
import { assertAIConfig, completeAIText, resolveAIConfig } from '@/lib/ai-provider'
import { sanitizeAIConfig } from '@/lib/ai-config'

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { success: false, error: 'ADMIN_TOKEN is not configured on server.' },
      { status: 503 }
    )
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let payload: { config?: unknown } | null = null
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const safeConfig = sanitizeAIConfig(payload?.config)
  const aiConfig = resolveAIConfig(safeConfig)

  try {
    assertAIConfig(aiConfig)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Invalid AI config' },
      { status: 400 }
    )
  }

  try {
    const content = await completeAIText(aiConfig, {
      messages: [
        { role: 'system', content: 'Return exactly one token: OK' },
        { role: 'user', content: 'Health check' },
      ],
      temperature: 0,
      maxTokens: 8,
      timeoutMs: 25000,
    })

    return NextResponse.json({
      success: true,
      provider: aiConfig.provider,
      model: aiConfig.model,
      preview: content.slice(0, 120),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        provider: aiConfig.provider,
        model: aiConfig.model,
        error: error instanceof Error ? error.message : 'Provider request failed',
      },
      { status: 502 }
    )
  }
}
