"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { ScrollReveal, FadeIn, SlideUp, SlideLeft, SlideRight } from "@/components/scroll-reveal"
import { TYPE_INFO } from "@/lib/mbti"
import { ArrowLeft, Users, Star } from "lucide-react"
import { cn } from "@/lib/utils"

// 名人示例数据
const CELEBRITIES: Record<string, string[]> = {
  INTJ: ["伊隆·马斯克", "史蒂夫·乔布斯", "尼古拉·特斯拉", "克里斯托弗·诺兰"],
  INTP: ["阿尔伯特·爱因斯坦", "比尔·盖茨", "查尔斯·达尔文", "艾萨克·牛顿"],
  ENTJ: ["史蒂夫·乔布斯", "沃伦·巴菲特", "拿破仑·波拿巴", "戈登·拉姆齐"],
  ENTP: ["沃尔特·怀特", "小罗伯特·唐尼", "理查德·费曼", "尼尔·帕特里克·哈里斯"],
  INFJ: ["尼尔森·曼德拉", "甘地", "马丁·路德·金", "柏拉图"],
  INFP: ["J·K·罗琳", "约翰尼·德普", "威廉·莎士比亚", "蒂姆·伯顿"],
  ENFJ: ["奥普拉·温弗瑞", "奥巴马", "马丁·路德·金", "玛雅·安吉洛"],
  ENFP: ["威尔·史密斯", "罗宾·威廉姆斯", "昆汀·塔伦蒂诺", "艾伦·德詹尼丝"],
  ISTJ: ["沃伦·巴菲特", "乔治·华盛顿", "安吉拉·默克尔", "德怀特·艾森豪威尔"],
  ISFJ: ["德蕾莎修女", "罗莎·帕克斯", "阿加莎·克里斯蒂", "凯特·米德尔顿"],
  ESTJ: ["亨利·福特", "弗兰克·辛纳屈", "维恩斯·朗巴第", "杰克·韦尔奇"],
  ESFJ: ["泰勒·斯威夫特", "珍妮弗·洛佩兹", "휴·杰克曼", "萨拉·佩林"],
  ISTP: ["克林特·伊斯特伍德", "迈克尔·乔丹", "布鲁斯·李", "汤姆·克鲁斯"],
  ISFP: ["迈克尔·杰克逊", "奥黛丽·赫本", "弗里达·卡罗", "鲍勃·迪伦"],
  ESTP: ["欧内斯特·海明威", "麦当娜", "布鲁斯·威利斯", "唐纳德·特朗普"],
  ESFP: ["小威廉姆斯", "埃尔顿·约翰", "杰米·福克斯", "梅丽尔·斯特里普"]
}

// 分组信息
const TYPE_GROUPS = [
  {
    title: "分析师 (NT)",
    description: "理性、独立、喜欢理论与可能性",
    types: ["INTJ", "INTP", "ENTJ", "ENTP"],
    gradient: "from-violet-500 to-fuchsia-500"
  },
  {
    title: "外交官 (NF)", 
    description: "热情、理想主义、富有创造力",
    types: ["INFJ", "INFP", "ENFJ", "ENFP"],
    gradient: "from-emerald-500 to-fuchsia-500"
  },
  {
    title: "守护者 (SJ)",
    description: "实用、注重事实、可靠稳定",
    types: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"], 
    gradient: "from-emerald-600 to-amber-500"
  },
  {
    title: "探险家 (SP)",
    description: "灵活、适应性强、善于随机应变",
    types: ["ISTP", "ISFP", "ESTP", "ESFP"],
    gradient: "from-amber-500 to-rose-500"
  }
]

export default function TypesPage() {
  return (
    <GradientBg className="min-h-[100dvh] bg-white">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* 页面头部 */}
        <div className="mb-8">
          <FadeIn>
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:underline mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回首页
            </Link>
          </FadeIn>
          <SlideUp delay={200}>
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight">
                探索 16 种
                <span className="block text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-500">
                  MBTI 人格类型
                </span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
                每种人格类型都有其独特的优势和特点。了解不同类型有助于更好地理解自己和他人，改善沟通与协作。
              </p>
            </div>
          </SlideUp>
        </div>

        {/* 人格类型分组 */}
        <div className="space-y-12">
          {TYPE_GROUPS.map((group, groupIndex) => (
            <section key={group.title} className="space-y-6">
              <FadeIn delay={groupIndex * 200}>
                <div className="text-center">
                  <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm bg-gradient-to-r", group.gradient)}>
                    <Users className="w-4 h-4" />
                    <span>{group.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
                </div>
              </FadeIn>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {group.types.map((type, typeIndex) => {
                  const info = TYPE_INFO[type]
                  const celebrities = CELEBRITIES[type] || []
                  
                  return (
                    <SlideUp key={type} delay={groupIndex * 200 + (typeIndex + 1) * 100}>
                      <Card className="rounded-2xl border-muted/60 hover:border-muted hover:shadow-sm transition-all">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm bg-gradient-to-br", info.gradient)}>
                              {type}
                            </div>
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br", info.gradient)}>
                              <Star className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{info.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-2">{info.blurb}</p>
                            <div className="text-xs text-foreground/70">{info.vibe}</div>
                          </div>
                          
                          <div className="pt-3 border-t border-muted/30">
                            <div className="text-xs font-medium text-foreground mb-2">🌟 代表名人</div>
                            <div className="space-y-1">
                              {celebrities.slice(0, 3).map((celeb, i) => (
                                <div key={i} className="text-xs text-muted-foreground">
                                  {celeb}
                                </div>
                              ))}
                              {celebrities.length > 3 && (
                                <div className="text-xs text-muted-foreground/70">
                                  +{celebrities.length - 3} 位更多...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </SlideUp>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {/* 行动号召 */}
        <SlideUp delay={600}>
          <div className="mt-16 text-center">
            <Card className="rounded-2xl border-muted/60">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">发现你的人格类型</h2>
                  <p className="text-muted-foreground">
                    通过专业的 MBTI 测试，了解你独特的性格特征和偏好
                  </p>
                  <Link href="/test">
                    <Button 
                      size="lg" 
                      className="rounded-2xl px-8 bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600"
                    >
                      开始测试
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </SlideUp>
      </main>
      
      <footer className="py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Aurora MBTI · 仅供娱乐与自我探索，不作为临床诊断依据
        </div>
      </footer>
    </GradientBg>
  )
}