"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { ArrowRight, Sparkles, ShieldCheck, Gauge, Palette, User, Brain, Lightbulb, Zap, CheckCircle, HelpCircle, FileText, Target, Users, MessageSquare } from "lucide-react"
import { type UserProfile } from "@/lib/mbti"

const PROFILE_KEY = "mbti_profile_v1"

export default function Page() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        const profile: UserProfile = JSON.parse(saved)
        // 检查必填项是否完整
        const isComplete = !!(profile.name && profile.age && profile.gender && profile.occupation)
        setHasProfile(isComplete)
      } else {
        setHasProfile(false)
      }
    } catch {
      setHasProfile(false)
    }
  }, [])
  return (
    <GradientBg className="min-h-[100dvh] bg-white">
      <SiteHeader />
      <main className="relative">
        <section className="pt-6 md:pt-12">
          <div className="max-w-6xl mx-auto px-4 md:px-6 grid gap-10 md:gap-14">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>高颜值 · 准确 · 无需登录</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight">
                  探索你的 MBTI 气质
                  <span className="block text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-500">
                    更懂自己，从这里开始
                  </span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  60 道精选题，一次专业、轻盈的自我画像。精致的视觉与流畅的交互，呈现你的性格偏好、能量来源与决策风格。
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {hasProfile ? (
                    <Link href="/test-mode" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="w-full rounded-2xl px-6 bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
                      >
                        立即开始测试
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="lg"
                      disabled
                      className="w-full sm:w-auto rounded-2xl px-6 opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                    >
                      立即开始测试
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  <Link href="/profile" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full rounded-2xl px-6 bg-transparent border-2 hover:bg-muted/50"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {hasProfile ? "修改资料" : "完善资料"}
                    </Button>
                  </Link>
                  <Link href="/types" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full rounded-2xl px-6 bg-transparent">
                      了解更多
                    </Button>
                  </Link>
                </div>
                
                {/* 提示信息 */}
                {hasProfile === false && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 text-sm">
                      <User className="w-4 h-4" />
                      <span className="font-medium">需要完善资料</span>
                    </div>
                    <p className="text-amber-600 text-sm mt-1">
                      为了提供更准确的个性化测试，请先完善您的基本资料
                    </p>
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-3xl border bg-gradient-to-br from-rose-50 via-amber-50 to-fuchsia-50 p-2 shadow-sm">
                  <div className="h-full w-full rounded-2xl bg-white/70 backdrop-blur-sm border flex items-center justify-center">
                    <video
                      className="rounded-2xl object-cover w-full h-full"
                      src="/视频旋转与移动生成.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    >
                      您的浏览器不支持视频播放。
                    </video>
                  </div>
                </div>
              </div>
            </div>

            <div id="features" className="grid md:grid-cols-3 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-lg mb-1">高颜值体验</div>
                  <p className="text-sm text-muted-foreground">柔和渐变、轻盈玻璃态，移动端与桌面端都同样顺滑。</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center mb-4">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-lg mb-1">快速准确</div>
                  <p className="text-sm text-muted-foreground">60 道精选题覆盖四大维度，智能计算偏好与百分比。</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-lg mb-1">隐私优先</div>
                  <p className="text-sm text-muted-foreground">数据仅保存在你的设备上，无需登录，无后台存储。</p>
                </CardContent>
              </Card>
            </div>

            {/* MBTI 介绍区块 */}
            <section className="py-16 border-t border-muted/20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm mb-4">
                  <Brain className="w-3.5 h-3.5" />
                  <span>什么是 MBTI</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4">深入了解你的人格类型</h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
                  MBTI（Myers-Briggs Type Indicator）是世界上应用最广泛的人格类型理论，通过四个维度的偏好组合，帮助你理解自己的行为模式、决策风格和人际互动方式。
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-2xl text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">能量来源</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div><strong className="text-emerald-600">外向(E)</strong> 从外界获得能量</div>
                      <div><strong className="text-teal-600">内向(I)</strong> 从内心获得能量</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center mx-auto mb-4">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">信息获取</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div><strong className="text-blue-600">感觉(S)</strong> 关注具体事实</div>
                      <div><strong className="text-indigo-600">直觉(N)</strong> 关注可能性</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">决策方式</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div><strong className="text-purple-600">思考(T)</strong> 基于逻辑分析</div>
                      <div><strong className="text-pink-600">情感(F)</strong> 基于价值观念</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">生活方式</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div><strong className="text-orange-600">判断(J)</strong> 喜欢计划和决定</div>
                      <div><strong className="text-red-600">知觉(P)</strong> 喜欢灵活应变</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* 如何运作流程 */}
            <section className="py-16 border-t border-muted/20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm mb-4">
                  <Zap className="w-3.5 h-3.5" />
                  <span>简单 3 步</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4">如何获得你的专属分析</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                  只需几分钟，就能获得详细的人格分析和个性化建议
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                      1
                    </div>
                    <div className="hidden md:block absolute top-6 left-full w-full flex justify-center">
                      <ArrowRight className="w-6 h-6 text-muted-foreground/60" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-xl mb-3">完善个人资料</h3>
                  <p className="text-muted-foreground">
                    填写基本信息，帮助我们为你生成更个性化的测试题目和分析结果
                  </p>
                </div>

                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                      2
                    </div>
                    <div className="hidden md:block absolute top-6 left-full w-full flex justify-center">
                      <ArrowRight className="w-6 h-6 text-muted-foreground/60" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-xl mb-3">选择测试模式</h3>
                  <p className="text-muted-foreground">
                    标准模式或AI个性化模式，体验不同的测试方式和题目内容
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                    3
                  </div>
                  <h3 className="font-semibold text-xl mb-3">获得专属分析</h3>
                  <p className="text-muted-foreground">
                    查看详细的人格分析报告，包含优势、挑战和个人发展建议
                  </p>
                </div>
              </div>
            </section>

            {/* AI特色功能 */}
            <section className="py-16 border-t border-muted/20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm mb-4">
                  <Brain className="w-3.5 h-3.5" />
                  <span>AI 驱动</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4">智能个性化体验</h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
                  利用先进的AI技术，为每个用户提供独一无二的测试体验和深度分析
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">AI个性化出题</h3>
                      <p className="text-muted-foreground">
                        基于你的年龄、职业、教育背景等信息，AI为你量身定制测试题目，让测试更贴合你的真实生活场景。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">智能结果分析</h3>
                      <p className="text-muted-foreground">
                        结合你的个人背景，AI深度分析你的人格特征，提供针对性的优势发现、挑战识别和成长建议。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">精准建议推荐</h3>
                      <p className="text-muted-foreground">
                        根据你的职业阶段和生活状况，提供个人成长、职业发展、人际关系等多维度的实用建议。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="aspect-square rounded-3xl border bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-8 shadow-sm">
                    <div className="h-full w-full rounded-2xl bg-white/80 backdrop-blur-sm border flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white flex items-center justify-center mx-auto">
                          <Brain className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-xl">AI 个性化</h3>
                          <p className="text-muted-foreground text-sm">
                            基于个人背景的<br />
                            智能测试体验
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ 常见问题 */}
            <section className="py-16 border-t border-muted/20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm mb-4">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>常见问题</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4">你可能想知道的</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                  关于 Aurora MBTI 测试的一些常见疑问
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">测试需要多长时间？</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          标准模式约5-8分钟，AI个性化模式根据选择的题目数量（30题或60题）约10-20分钟。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">数据安全如何保障？</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          所有数据仅保存在您的设备本地，无需注册登录，不会上传到服务器，完全保护您的隐私。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">结果准确度如何？</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          基于经典MBTI理论，结合现代心理测评方法，AI个性化模式提供更贴合个人情况的分析。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">可以重新测试吗？</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          当然可以！您可以随时重新完善资料或选择不同的测试模式，获得新的分析结果。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </section>
      </main>
      <footer className="py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Aurora MBTI · 仅供娱乐与自我探索，不作为临床诊断依据
        </div>
      </footer>
    </GradientBg>
  )
}
