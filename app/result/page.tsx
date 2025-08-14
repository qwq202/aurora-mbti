"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { formatScoresForShare, type MbtiResult, typeDisplayInfo, type UserProfile } from "@/lib/mbti"
import { getWorkEnvironment, getCommunicationStyle, getPotentialChallenges, getPracticalTips, type HistoryEntry, RESULT_KEY, ANSWERS_KEY, HISTORY_KEY, COMPARE_KEY } from "@/lib/result-helpers"
import { ArrowLeft, Copy, Home, Share2, Sparkles, Star, Target, TrendingUp, Users, Loader, FileJson, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import dynamic from "next/dynamic"

const RadarChart = dynamic(() => import("@/components/charts/RadarChart").then(mod => ({ default: mod.RadarChart })), {
  loading: () => <div className="flex items-center justify-center h-[320px] text-muted-foreground">加载图表中...</div>,
  ssr: false
})


export default function ResultPage() {
  const [result, setResult] = useState<MbtiResult | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [testMode, setTestMode] = useState<string>("standard")
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [streamingAnalysis, setStreamingAnalysis] = useState<string>('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [compareEntry, setCompareEntry] = useState<HistoryEntry | null>(null)
  const isAiMode = useMemo(() => testMode?.startsWith("ai"), [testMode])
  const { toast } = useToast()

  // 初始化：从本地读取结果、资料、测试模式与对比目标
  useEffect(() => {
    try {
      const savedResult = localStorage.getItem(RESULT_KEY)
      if (savedResult) setResult(JSON.parse(savedResult))

      const savedProfile = localStorage.getItem("mbti_profile_v1")
      if (savedProfile) setProfile(JSON.parse(savedProfile))

      const savedMode = localStorage.getItem("mbti_test_mode_v1")
      if (savedMode) setTestMode(savedMode)

      const savedCompare = localStorage.getItem(COMPARE_KEY)
      if (savedCompare) setCompareEntry(JSON.parse(savedCompare))
    } catch {}
  }, [])

  // 保存当前结果到历史记录
  const saveToHistory = () => {
    if (!result) {
      toast({ title: "无法保存", description: "当前没有可保存的结果", variant: "destructive" })
      return
    }
    try {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        testMode,
        result,
        profile: profile ?? null,
      }
      const raw = localStorage.getItem(HISTORY_KEY)
      const list: HistoryEntry[] = raw ? JSON.parse(raw) : []
      list.unshift(entry)
      // 可选：限制最大条数
      const capped = list.slice(0, 100)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(capped))
      toast({ title: "已保存到历史", description: `类型 ${result.type} 已保存` })
    } catch (e) {
      console.error(e)
      toast({ title: "保存失败", description: "写入历史记录时出现问题", variant: "destructive" })
    }
  }

  // 导出JSON
  const exportJSON = () => {
    if (!result) return
    try {
      const data = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        testMode,
        result,
        profile: profile ?? null,
        aiAnalysis: aiAnalysis ?? null,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const date = new Date().toISOString().slice(0, 10)
      a.download = `mbti-${result.type}-${date}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ title: "JSON 已导出", description: "下载已开始" })
    } catch (e) {
      console.error(e)
      toast({ title: "导出失败", description: "导出 JSON 时出现问题", variant: "destructive" })
    }
  }

  

  // 生成社交卡 PNG（将SVG转为图片，再绘制到Canvas）
  const generateSocialCardPng = async () => {
    if (!result) return
    try {
      const width = 1200
      const height = 630
      const info = typeDisplayInfo(result.type)
      const userName = profile?.name || '用户'
      const testModeLabel = testMode?.startsWith('ai') ? 'AI智能模式' : '标准模式'
      const aiSummary = (aiAnalysis?.summary || info?.blurb || '个性鲜明，优势突出').slice(0, 120)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aurora-mbti.example.com'
      const socialPrefMap: Record<string, string> = { quiet: '安静内向', social: '社交活跃', balanced: '自在平衡' }
      const socialPref = (profile?.socialPreference && socialPrefMap[profile.socialPreference]) || '多元偏好'
      const confidence = Math.round(result.confidence?.overall ?? 0)

      // 设备像素比缩放，导出更清晰
      const scale = Math.min(2, Math.max(1, Math.floor((window.devicePixelRatio || 1))))

      // 计算主导维度
      const dominantDims = [
        result.scores.EI?.percentFirst >= 60 ? 'E' : result.scores.EI?.percentSecond >= 60 ? 'I' : null,
        result.scores.SN?.percentFirst >= 60 ? 'S' : result.scores.SN?.percentSecond >= 60 ? 'N' : null,
        result.scores.TF?.percentFirst >= 60 ? 'T' : result.scores.TF?.percentSecond >= 60 ? 'F' : null,
        result.scores.JP?.percentFirst >= 60 ? 'J' : result.scores.JP?.percentSecond >= 60 ? 'P' : null,
      ].filter(Boolean)

      // 核心优势标签
      const strengthTags = info?.strengths?.slice(0, 3) || ['专注高效', '逻辑清晰', '目标导向']

      // 维度数据（用于雷达与条形图）
      const dims = [
        { key: 'EI', left: 'E', right: 'I', leftPct: result.scores.EI?.percentFirst ?? 50, rightPct: result.scores.EI?.percentSecond ?? 50 },
        { key: 'SN', left: 'S', right: 'N', leftPct: result.scores.SN?.percentFirst ?? 50, rightPct: result.scores.SN?.percentSecond ?? 50 },
        { key: 'TF', left: 'T', right: 'F', leftPct: result.scores.TF?.percentFirst ?? 50, rightPct: result.scores.TF?.percentSecond ?? 50 },
        { key: 'JP', left: 'J', right: 'P', leftPct: result.scores.JP?.percentFirst ?? 50, rightPct: result.scores.JP?.percentSecond ?? 50 },
      ]

      // 构建SVG（更现代的布局与信息密度）
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312e81"/>
      <stop offset="30%" stop-color="#7c3aed"/>
      <stop offset="70%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fafafa"/>
    </linearGradient>

    <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>

    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="cardShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.15"/>
    </filter>

    <pattern id="gridPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.08"/>
    </pattern>
  </defs>

  <!-- 背景 -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  <rect width="100%" height="100%" fill="url(#gridPattern)"/>

  <!-- 主卡片容器 -->
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}" rx="28" fill="url(#cardGradient)" filter="url(#cardShadow)"/>

  <!-- 顶部信息条 -->
  <g transform="translate(60, 80)">
    <circle cx="24" cy="24" r="24" fill="url(#badgeGradient)"/>
    <text x="24" y="30" font-family="Arial" font-size="18" fill="#fff" text-anchor="middle" font-weight="bold">${userName.charAt(0).toUpperCase()}</text>
    <text x="70" y="22" font-family="PingFang SC,sans-serif" font-size="18" fill="#111827" font-weight="700">${userName}</text>
    <rect x="70" y="30" width="98" height="22" rx="11" fill="#f3f4f6"/>
    <text x="119" y="45" font-family="PingFang SC,sans-serif" font-size="11" fill="#6b7280" text-anchor="middle">${testModeLabel}</text>
    <rect x="180" y="30" width="98" height="22" rx="11" fill="#ecfeff" stroke="#06b6d4" stroke-width="1"/>
    <text x="229" y="45" font-family="PingFang SC,sans-serif" font-size="11" fill="#0e7490" text-anchor="middle">${socialPref}</text>
    <rect x="290" y="30" width="120" height="22" rx="11" fill="#f0fdf4" stroke="#10b981" stroke-width="1"/>
    <text x="350" y="45" font-family="PingFang SC,sans-serif" font-size="11" fill="#065f46" text-anchor="middle">可信度 ${confidence}%</text>
    <text x="${width - 120}" y="18" font-family="PingFang SC,sans-serif" font-size="12" fill="#6b7280" text-anchor="end">${new Date().toLocaleDateString()}</text>
  </g>

  <!-- 左侧主信息 -->
  <g transform="translate(80, 150)">
    <rect x="0" y="0" width="260" height="140" rx="20" fill="url(#badgeGradient)" filter="url(#glow)"/>
    <text x="130" y="64" font-family="Arial Black,sans-serif" font-size="52" fill="#fff" text-anchor="middle" font-weight="900">${result.type}</text>
    <text x="130" y="94" font-family="PingFang SC,sans-serif" font-size="16" fill="rgba(255,255,255,0.95)" text-anchor="middle" font-weight="600">${info?.name || ''}</text>
    ${dominantDims.length > 0 ? `
      <g transform="translate(20, 110)">
        ${dominantDims.map((dim, i) => `
          <circle cx="${i * 28 + 14}" cy="12" r="9" fill="rgba(255,255,255,0.32)"/>
          <text x="${i * 28 + 14}" y="16" font-family="Arial,sans-serif" font-size="10" fill="#fff" text-anchor="middle" font-weight="bold">${dim}</text>
        `).join('')}
      </g>` : ''}

    <!-- AI摘要 -->
    <g transform="translate(0, 160)">
      <rect x="0" y="0" width="520" height="86" rx="16" fill="#f8fafc" stroke="#e5e7eb" stroke-width="1"/>
      <text x="16" y="24" font-family="PingFang SC,sans-serif" font-size="12" fill="#64748b" font-weight="700">💡 AI 个性化分析</text>
      <text x="16" y="46" font-family="PingFang SC,sans-serif" font-size="14" fill="#374151">
        <tspan x="16" dy="0">${aiSummary}</tspan>
      </text>
      <text x="16" y="70" font-family="PingFang SC,sans-serif" font-size="11" fill="#9ca3af">基于资料、答题与结果综合生成</text>
    </g>

    <!-- 核心优势标签 -->
    <g transform="translate(0, 262)">
      <text x="0" y="14" font-family="PingFang SC,sans-serif" font-size="14" fill="#374151" font-weight="700">🌟 核心优势</text>
      ${strengthTags.map((tag, i) => `
        <g transform="translate(${i * 130}, 22)">
          <rect x="0" y="0" width="120" height="28" rx="14" fill="${i === 0 ? '#ecfdf5' : i === 1 ? '#fff7ed' : '#fdf2f8'}" stroke="${i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#ec4899'}" stroke-width="1"/>
          <text x="60" y="19" font-family="PingFang SC,sans-serif" font-size="12" fill="${i === 0 ? '#065f46' : i === 1 ? '#7c2d12' : '#9d174d'}" text-anchor="middle">${tag}</text>
        </g>
      `).join('')}
    </g>
  </g>

  <!-- 右侧分析模块 -->
  <g transform="translate(620, 150)">
    <rect x="0" y="0" width="460" height="340" rx="20" fill="#fafafa" stroke="#e5e7eb" stroke-width="1"/>
    <text x="230" y="26" font-family="PingFang SC,sans-serif" font-size="16" fill="#111827" text-anchor="middle" font-weight="700">维度分析</text>

    <!-- 简化雷达图 -->
    <g transform="translate(230, 156)">
      <g stroke="#d1d5db" stroke-width="1" fill="none">
        <circle cx="0" cy="0" r="20"/>
        <circle cx="0" cy="0" r="40"/>
        <circle cx="0" cy="0" r="60"/>
        <circle cx="0" cy="0" r="80"/>
        <line x1="-80" y1="0" x2="80" y2="0"/>
        <line x1="0" y1="-80" x2="0" y2="80"/>
        <line x1="-56" y1="-56" x2="56" y2="56"/>
        <line x1="-56" y1="56" x2="56" y2="-56"/>
      </g>
      ${dims.map((d, i) => {
        const angle = (i * 90 - 90) * Math.PI / 180
        const radius = (d.leftPct > d.rightPct ? d.leftPct : d.rightPct) * 0.8
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        return `
          <circle cx="${x}" cy="${y}" r="4" fill="#3b82f6"/>
        `
      }).join('')}
      <path d="M ${dims.map((d, i) => {
        const angle = (i * 90 - 90) * Math.PI / 180
        const radius = (d.leftPct > d.rightPct ? d.leftPct : d.rightPct) * 0.8
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      }).join(' ')} Z" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2"/>
    </g>

    <!-- 维度条形图 -->
    <g transform="translate(20, 292)">
      ${dims.map((d, i) => `
        <g transform="translate(0, ${i * 18})">
          <text x="0" y="10" font-family="PingFang SC,sans-serif" font-size="12" fill="#6b7280">${d.key}</text>
          <rect x="40" y="2" width="180" height="10" rx="5" fill="#ecfeff" stroke="#e5e7eb"/>
          <rect x="40" y="2" width="${Math.max(6, Math.round(d.leftPct * 1.8))}" height="10" rx="5" fill="#38bdf8"/>
          <rect x="220" y="2" width="180" height="10" rx="5" fill="#fdf2f8" stroke="#e5e7eb"/>
          <rect x="${400 - Math.max(6, Math.round(d.rightPct * 1.8))}" y="2" width="${Math.max(6, Math.round(d.rightPct * 1.8))}" height="10" rx="5" fill="#f472b6"/>
          <text x="230" y="11" font-family="PingFang SC,sans-serif" font-size="11" fill="#6b7280">${d.left} ${d.leftPct}%</text>
          <text x="390" y="11" font-family="PingFang SC,sans-serif" font-size="11" fill="#6b7280" text-anchor="end">${d.rightPct}% ${d.right}</text>
        </g>
      `).join('')}
    </g>
  </g>

  <!-- 底部品牌与链接 -->
  <g transform="translate(80, 520)">
    <text x="0" y="20" font-family="PingFang SC,sans-serif" font-size="18" fill="#ec4899" font-weight="800">Aurora MBTI</text>
    <text x="0" y="40" font-family="PingFang SC,sans-serif" font-size="12" fill="#9ca3af">${info?.vibe || '探索你的独特风格'}</text>
    <rect x="380" y="0" width="72" height="72" rx="10" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
    <text x="416" y="26" font-family="PingFang SC,sans-serif" font-size="10" fill="#6b7280" text-anchor="middle">扫码体验</text>
    <text x="416" y="44" font-family="PingFang SC,sans-serif" font-size="10" fill="#6b7280" text-anchor="middle">${new URL(baseUrl).host}</text>
    <text x="${width - 120}" y="50" font-family="PingFang SC,sans-serif" font-size="10" fill="#9ca3af" text-anchor="end">v1.1</text>
  </g>
</svg>`

      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = width * scale
            canvas.height = height * scale
            const ctx = canvas.getContext('2d')!
            ctx.scale(scale, scale)
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, width, height)
            URL.revokeObjectURL(url)
            canvas.toBlob((png) => {
              if (!png) {
                reject(new Error('PNG 生成失败'))
                return
              }
              const date = new Date().toISOString().slice(0, 10)
              const dl = document.createElement('a')
              dl.href = URL.createObjectURL(png)
              dl.download = `aurora-mbti-${result.type}-${date}.png`
              document.body.appendChild(dl)
              dl.click()
              dl.remove()
              resolve()
            }, 'image/png')
          } catch (err) {
            reject(err as any)
          }
        }
        img.onerror = () => reject(new Error('SVG 加载失败'))
        img.src = url
      })
      toast({ title: '卡片已生成', description: '已下载社交分享卡片 PNG（高清）' })
    } catch (e) {
      console.error(e)
      toast({ title: '生成失败', description: '生成社交卡片失败', variant: 'destructive' })
    }
  }

  const generateAIAnalysis = async () => {
    if (!result || !profile || isAnalyzing) return
    
    setIsAnalyzing(true)
    setStreamingAnalysis('') 
    setAiAnalysis(null)  // 清空旧的分析结果
    
    try {
      const answers = JSON.parse(localStorage.getItem("mbti_answers_v1") || "{}")
      const questions = testMode.startsWith("ai") 
        ? JSON.parse(localStorage.getItem("mbti_ai_questions_v1") || "[]")
        : []
      
      // 使用流式分析API
      const response = await fetch('/api/generate-analysis-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile,
          answers,
          questions,
          mbtiResult: result
        })
      })

      if (!response.ok) {
        throw new Error(`流式分析失败: ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }
      
      let accumulatedContent = ''
      
      // 不显示初始提示toast，按钮状态已足够清楚
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        // 解析SSE数据
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'delta') {
                accumulatedContent = parsed.content
                // 实时更新流式分析内容（打字机效果）
                setStreamingAnalysis(parsed.content || accumulatedContent)
                
              } else if (parsed.type === 'done') {
                // 流结束，解析最终结果
                try {
                  // 解析JSON内容 - 添加验证机制
                  const jsonMatch = parsed.content.match(/\{[\s\S]*\}/)
                  if (jsonMatch) {
                    const jsonStr = jsonMatch[0]
                    
                    // 验证JSON是否完整（检查括号匹配）
                    const openBraces = (jsonStr.match(/\{/g) || []).length
                    const closeBraces = (jsonStr.match(/\}/g) || []).length
                    
                    if (openBraces !== closeBraces) {
                      console.log('分析JSON还不完整，继续等待...')
                      return
                    }
                    
                    const analysisResult = JSON.parse(jsonStr)
                    const analysis = analysisResult.analysis || {}
                    
                    setAiAnalysis(analysis)
                    setStreamingAnalysis('')  // 清空流式内容
                    
                    // 保存AI分析结果
                    localStorage.setItem('mbti_ai_analysis_v1', JSON.stringify(analysis))
                    
                    toast({ 
                      title: 'AI分析完成！', 
                      description: '个性化分析报告已生成，请查看下方内容'
                    })
                    
                    return
                  }
                  throw new Error('解析分析结果失败')
                } catch (parseError) {
                  console.error('解析分析结果失败:', parseError)
                  throw new Error('生成的分析结果格式无效')
                }
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error)
              }
            } catch (parseError) {
              // 忽略解析错误，继续读取
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error generating AI analysis:', error)
      setStreamingAnalysis('')
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "AI分析生成失败，请检查网络后重试",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyAnalysis = async () => {
    if (!aiAnalysis) return
    const { summary, strengths, challenges, recommendations, careerGuidance, personalGrowth, relationships } = aiAnalysis
    const text = [
      `【AI 个性化分析】`,
      summary ? `概述：${summary}` : "",
      strengths?.length ? `优势：\n- ${strengths.join("\n- ")}` : "",
      challenges?.length ? `挑战：\n- ${challenges.join("\n- ")}` : "",
      recommendations?.length ? `建议：\n- ${recommendations.join("\n- ")}` : "",
      careerGuidance ? `职业发展：${careerGuidance}` : "",
      personalGrowth ? `个人成长：${personalGrowth}` : "",
      relationships ? `人际关系：${relationships}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "复制成功",
        description: "AI分析内容已复制到剪贴板",
      })
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast({
        title: "复制失败",
        description: "无法访问剪贴板，请手动复制",
        variant: "destructive",
      })
    }
  }

  const handleRegenerateAnalysis = () => {
    setShowRegenerateDialog(true)
  }
  
  const confirmRegenerateAnalysis = async () => {
    setShowRegenerateDialog(false)
    try {
      localStorage.removeItem('mbti_ai_analysis_v1')
      setAiAnalysis(null)
      await generateAIAnalysis()
    } catch (error) {
      console.error('Error regenerating analysis:', error)
      toast({
        title: "重新生成失败",
        description: "重新生成AI分析时出错，请重试",
        variant: "destructive",
      })
    }
  }

  // 检查是否已有AI分析结果（本地缓存）
  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem('mbti_ai_analysis_v1')
      if (savedAnalysis) {
        setAiAnalysis(JSON.parse(savedAnalysis))
      }
    } catch {}
  }, [testMode])

  const info = useMemo(() => (result ? typeDisplayInfo(result.type) : null), [result])

  const share = async () => {
    if (!result) return
    // 获取当前网站的完整URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mbti.example.com'
    const text = `我的 MBTI 类型是 ${result.type}\n${formatScoresForShare(result)}\n来测一测你是哪一型：${baseUrl}`
    try {
      if (navigator.share) {
        await navigator.share({ title: "我的 MBTI 类型", text })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        toast({
          title: "复制成功",
          description: "测试结果已复制到剪贴板",
        })
      }
    } catch {
      toast({
        title: "分享失败",
        description: "无法分享或复制内容，请重试",
        variant: "destructive",
      })
    }
  }

  const copyBrief = async () => {
    if (!result) return
    const text = `MBTI: ${result.type}\n${formatScoresForShare(result)}`
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "复制成功",
        description: "简要结果已复制到剪贴板",
      })
    } catch {
      toast({
        title: "复制失败",
        description: "无法访问剪贴板，请重试",
        variant: "destructive",
      })
    }
  }

  const retake = () => {
    try {
      localStorage.removeItem(RESULT_KEY)
      localStorage.removeItem(ANSWERS_KEY)
    } catch {}
  }

  if (!result) {
    return (
      <GradientBg className="min-h-[100dvh] bg-white">
        <SiteHeader />
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <Card className="rounded-2xl">
            <CardContent className="p-8 md:p-10 text-center">
              <div className="text-xl md:text-2xl font-semibold mb-3">尚未生成结果</div>
              <p className="text-muted-foreground mb-6">请先完成测试，然后在这里查看你的个性类型与维度百分比。</p>
              <Link href="/test">
                <Button className="rounded-xl">
                  去开始测试
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </GradientBg>
    )
  }

  const dims = result.scores
  const gradient = info?.gradient || "from-fuchsia-500 to-rose-500"

  const bars: Array<{
    key: keyof typeof dims
    title: string
    left: string
    right: string
    leftPct: number
    rightPct: number
  }> = [
    {
      key: "EI",
      title: "能量来源",
      left: "E 外向",
      right: "I 内向",
      leftPct: dims.EI.percentFirst,
      rightPct: dims.EI.percentSecond,
    },
    {
      key: "SN",
      title: "信息获取",
      left: "S 事实",
      right: "N 直觉",
      leftPct: dims.SN.percentFirst,
      rightPct: dims.SN.percentSecond,
    },
    {
      key: "TF",
      title: "决策倾向",
      left: "T 思考",
      right: "F 情感",
      leftPct: dims.TF.percentFirst,
      rightPct: dims.TF.percentSecond,
    },
    {
      key: "JP",
      title: "生活方式",
      left: "J 计划",
      right: "P 自由",
      leftPct: dims.JP.percentFirst,
      rightPct: dims.JP.percentSecond,
    },
  ]

  return (
    <GradientBg className="min-h-[100dvh] bg-white">
      <SiteHeader className="backdrop-blur supports-[backdrop-filter]:bg-white/50 sticky top-0 border-b" />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
          <section>
            <div className={cn("rounded-3xl p-6 md:p-8 border relative overflow-hidden")}>
              <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", gradient)} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Link href="/" className="text-sm text-muted-foreground hover:underline flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    返回首页
                  </Link>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl bg-transparent" onClick={copyBrief}>
                      复制结果
                      <Copy className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
                      onClick={share}
                    >
                      分享
                      <Share2 className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground">你的 MBTI 类型</div>
                    <div className="text-4xl md:text-6xl font-semibold tracking-tight">
                      <span className={cn("text-transparent bg-clip-text bg-gradient-to-br", gradient)}>
                        {result.type}
                      </span>
                      <span className="ml-3 text-xl md:text-2xl text-muted-foreground">{info?.name}</span>
                    </div>
                    <div className="mt-3 text-sm md:text-base text-muted-foreground">{info?.blurb}</div>
                    <div className="mt-2 text-xs md:text-sm text-foreground/80">气质关键词：{info?.vibe}</div>
                  </div>
                  <div className="shrink-0">
                    <div
                      className={cn(
                        "w-28 h-28 md:w-32 md:h-32 rounded-2xl border flex items-center justify-center text-3xl md:text-4xl font-bold bg-gradient-to-br text-white shadow-sm",
                        gradient,
                      )}
                    >
                      {result.type}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">维度雷达图</div>
                <div className="text-xs text-muted-foreground">百分比越高越接近左侧字母</div>
              </div>
              <div className="flex flex-col items-center justify-center gap-2">
                <RadarChart 
                  scores={dims as any} 
                  size={320}
                  compareScores={compareEntry?.result?.scores as any}
                />
                {compareEntry && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[rgba(236,72,153,0.6)] border border-fuchsia-500" /> 当前</span>
                    <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[rgba(16,185,129,0.4)] border border-emerald-500" /> 对比：{compareEntry.result.type}（{new Date(compareEntry.createdAt).toLocaleDateString()}）</span>
                    <button className="underline" onClick={() => { localStorage.removeItem(COMPARE_KEY); setCompareEntry(null) }}>清除对比</button>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-xl bg-transparent" onClick={saveToHistory}>
                    保存到历史
                    <History className="w-4 h-4 ml-2" />
                  </Button>
                  <Link href="/history">
                    <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                      历史记录
                      <Users className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="rounded-xl bg-transparent" onClick={exportJSON}>
                    导出 JSON
                    <FileJson className="w-4 h-4 ml-2" />
                  </Button>
                  
                  
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {bars.map((b) => (
                <div key={b.key} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <div className="font-medium">{b.title}</div>
                    <div className="text-muted-foreground">
                      {b.left} · {b.right}
                    </div>
                  </div>
                  <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-emerald-400"
                      style={{ width: `${b.leftPct}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-rose-400"
                      style={{ width: `${b.rightPct}%` }}
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 flex items-center justify-between text-[10px] px-2 font-medium text-white/90">
                      <span>{b.leftPct}%</span>
                      <span>{b.rightPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 成长建议 - AI分析后移到左侧 */}
            {aiAnalysis && (
              <Card className="rounded-2xl mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="font-semibold">成长建议</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-foreground mb-2">🎯 发展方向</div>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {info?.growth.map((g, i) => (
                          <li key={`gr-${i}`}>{g}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/30">
                      <div className="text-sm font-medium text-foreground mb-2">⚡ 潜在挑战</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {getPotentialChallenges(result.type)}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/30">
                      <div className="text-sm font-medium text-foreground mb-2">💡 实用建议</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {getPracticalTips(result.type)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


          </section>

          <aside className="space-y-6">
            {/* AI 个性化分析 */}
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="font-semibold">AI 个性化分析</div>
                  </div>
                  {isAiMode ? (
                    <span className="text-xs text-muted-foreground">AI 模式</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">基于你的资料与结果</span>
                  )}
                </div>

                {!aiAnalysis && !streamingAnalysis ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      由 AI 结合你的个人资料、答题与结果，生成更具针对性的解读与建议。
                    </p>
                    <Button
                      className={cn("w-full rounded-xl text-white", `bg-gradient-to-br hover:opacity-90 ${gradient}`)}
                      onClick={generateAIAnalysis}
                      disabled={isAnalyzing || !profile}
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          AI正在分析中...
                        </div>
                      ) : (
                        '生成AI分析'
                      )}
                    </Button>
                    {!profile && (
                      <p className="text-xs text-amber-600">需要先在资料页完善个人资料后再生成分析。</p>
                    )}
                  </div>
                ) : (isAnalyzing || streamingAnalysis) && !aiAnalysis ? (
                  // 流式分析内容（打字机效果）
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Loader className="h-4 w-4 animate-spin" />
                      AI正在生成个性化分析报告...
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg border border-dashed">
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {streamingAnalysis || '正在连接AI分析服务...'}
                        <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-muted/30">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={generateAIAnalysis}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            重新生成中...
                          </div>
                        ) : (
                          '重新生成分析'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-4">
                    {aiAnalysis.summary && (
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">🧭 概述</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.summary}</div>
                      </div>
                    )}
                    {Array.isArray(aiAnalysis.strengths) && aiAnalysis.strengths.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">✨ 优势</div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {aiAnalysis.strengths.map((s: string, i: number) => (
                            <li key={`a-st-${i}`}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(aiAnalysis.challenges) && aiAnalysis.challenges.length > 0 && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">⚠️ 潜在挑战</div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {aiAnalysis.challenges.map((c: string, i: number) => (
                            <li key={`a-ch-${i}`}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">💡 具体建议</div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {aiAnalysis.recommendations.map((r: string, i: number) => (
                            <li key={`a-re-${i}`}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiAnalysis.careerGuidance && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">🏹 职业发展建议</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.careerGuidance}</div>
                      </div>
                    )}
                    {aiAnalysis.personalGrowth && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">🌱 个人成长方向</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.personalGrowth}</div>
                      </div>
                    )}
                    {aiAnalysis.relationships && (
                      <div className="pt-2 border-t border-muted/30">
                        <div className="text-sm font-medium text-foreground mb-1">🤝 人际关系建议</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.relationships}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button variant="outline" className="rounded-xl bg-transparent" onClick={copyAnalysis}>
                        复制分析
                        <Copy className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        className={cn("rounded-xl text-white", `bg-gradient-to-br hover:opacity-90 ${gradient}`)} 
                        onClick={handleRegenerateAnalysis}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <div className="flex items-center gap-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            重新生成中...
                          </div>
                        ) : (
                          <>
                            重新生成
                            <Sparkles className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">分析已自动保存到本地，仅你可见。</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                    <Star className="w-4 h-4" />
                  </div>
                  <div className="font-semibold">你的独特风格</div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-foreground mb-2">✨ 核心优势</div>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {info?.strengths.map((s, i) => (
                        <li key={`st-${i}`}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-muted/30">
                    <div className="text-sm font-medium text-foreground mb-2">🎯 适合的工作环境</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {getWorkEnvironment(result.type)}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-muted/30">
                    <div className="text-sm font-medium text-foreground mb-2">🤝 沟通偏好</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {getCommunicationStyle(result.type)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 成长建议 - AI分析生成后移到左侧，右侧不再显示 */}
            {!aiAnalysis && (
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="font-semibold">成长建议</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-foreground mb-2">🎯 发展方向</div>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {info?.growth.map((g, i) => (
                          <li key={`gr-${i}`}>{g}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/30">
                      <div className="text-sm font-medium text-foreground mb-2">⚡ 潜在挑战</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {getPotentialChallenges(result.type)}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/30">
                      <div className="text-sm font-medium text-foreground mb-2">💡 实用建议</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {getPracticalTips(result.type)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 下一步 - 移到右侧 */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", `bg-gradient-to-br ${gradient}`)}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="font-semibold">下一步</div>
                </div>
                <div className="grid gap-3">
                  <Link href="/test" onClick={retake}>
                    <Button variant="outline" className="w-full rounded-xl bg-transparent hover:bg-muted/50">
                      再测一次
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button className={cn("w-full rounded-xl text-white", `bg-gradient-to-br hover:opacity-90 ${gradient}`)}>
                      返回首页
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

          </aside>
        </div>
      </main>
      <footer className="py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Aurora MBTI · 仅供娱乐与自我探索，不作为临床诊断依据
        </div>
      </footer>

      <ConfirmDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
        title="重新生成AI分析"
        description="确定要重新生成AI分析吗？这将覆盖当前的分析结果。"
        confirmText="重新生成"
        cancelText="取消"
        variant="default"
        onConfirm={confirmRegenerateAnalysis}
      />
    </GradientBg>
  )
}
