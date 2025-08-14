"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SiteHeader } from "@/components/site-header"
import { GradientBg } from "@/components/gradient-bg"
import { type UserProfile } from "@/lib/mbti"
import { ArrowLeft, ArrowRight, User, Save, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const PROFILE_KEY = "mbti_profile_v1"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    age: 18, // 默认18岁
    gender: "",
    occupation: "",
    education: "",
    relationship: "",
    interests: "",
    workStyle: "",
    stressLevel: "",
    socialPreference: ""
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        setProfile(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const updateProfile = (field: keyof UserProfile, value: string | number) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value }
      
      // 如果职业改变，自动调整教育程度以保持逻辑一致性
      if (field === 'occupation') {
        if (value === '初中生') {
          updated.education = 'junior_high'
        } else if (value === '高中生' || value === '中职学生') {
          updated.education = 'high_school'
        } else if (value === '实习生' || value === '兼职学生') {
          // 实习生和兼职学生通常是高中或以上
          if (!updated.education || updated.education === 'junior_high') {
            updated.education = 'high_school'
          }
        }
      }
      
      // 如果职业或教育程度改变，检查是否需要清空工作方式偏好
      if (field === 'occupation' || field === 'education') {
        const shouldHideWorkStyle = 
          (updated.occupation && ["初中生", "高中生", "中职学生"].includes(updated.occupation)) ||
          (updated.occupation === "学生" && ["high_school", "junior_high"].includes(updated.education))
        
        if (shouldHideWorkStyle && updated.workStyle) {
          updated.workStyle = ""
        }
      }
      
      return updated
    })
    setSaved(false)
  }

  const saveProfile = () => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
  }

  const startTest = () => {
    if (!isComplete) return
    saveProfile()
    router.push("/test-mode?from=profile")
  }

  const isComplete = profile.name && profile.age && profile.gender && profile.occupation

  return (
    <GradientBg className="min-h-[100dvh] bg-white">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold">完善个人资料</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              提供一些基本信息，我们将为您推荐更贴合的测试题目，让结果更加准确和个性化。
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-fuchsia-500 text-white flex items-center justify-center text-sm">
                  1
                </div>
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  placeholder="请输入您的姓名"
                  value={profile.name}
                  onChange={(e) => updateProfile("name", e.target.value)}
                  className="w-full rounded-xl"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>年龄 *</Label>
                  <Select value={profile.age ? String(profile.age) : ""} onValueChange={(value) => updateProfile("age", parseInt(value) || 0)}>
                    <SelectTrigger className="w-full rounded-xl h-12">
                      <SelectValue placeholder="18岁" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 83 }, (_, i) => i + 13).map(age => (
                        <SelectItem key={age} value={String(age)}>
                          {age}岁
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>性别 *</Label>
                  <Select value={profile.gender} onValueChange={(value) => updateProfile("gender", value)}>
                    <SelectTrigger className="w-full rounded-xl h-12">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男</SelectItem>
                      <SelectItem value="female">女</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>职业 *</Label>
                <Select value={profile.occupation} onValueChange={(value) => updateProfile("occupation", value)}>
                  <SelectTrigger className="w-full rounded-xl h-12">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {profile.age < 18 ? (
                      <>
                        <SelectItem value="初中生">初中生</SelectItem>
                        <SelectItem value="高中生">高中生</SelectItem>
                        <SelectItem value="中职学生">中职学生</SelectItem>
                        <SelectItem value="实习生">实习生</SelectItem>
                        <SelectItem value="兼职学生">兼职学生</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="学生">学生</SelectItem>
                        <SelectItem value="软件工程师">软件工程师</SelectItem>
                        <SelectItem value="教师">教师</SelectItem>
                        <SelectItem value="医生">医生</SelectItem>
                        <SelectItem value="护士">护士</SelectItem>
                        <SelectItem value="设计师">设计师</SelectItem>
                        <SelectItem value="销售">销售</SelectItem>
                        <SelectItem value="市场营销">市场营销</SelectItem>
                        <SelectItem value="财务">财务</SelectItem>
                        <SelectItem value="人力资源">人力资源</SelectItem>
                        <SelectItem value="律师">律师</SelectItem>
                        <SelectItem value="咨询师">咨询师</SelectItem>
                        <SelectItem value="创业者">创业者</SelectItem>
                        <SelectItem value="自由职业">自由职业</SelectItem>
                        <SelectItem value="公务员">公务员</SelectItem>
                        <SelectItem value="工程师">工程师</SelectItem>
                        <SelectItem value="研究员">研究员</SelectItem>
                        <SelectItem value="媒体工作者">媒体工作者</SelectItem>
                        <SelectItem value="服务业">服务业</SelectItem>
                        <SelectItem value="制造业">制造业</SelectItem>
                        <SelectItem value="金融业">金融业</SelectItem>
                        <SelectItem value="退休">退休</SelectItem>
                        <SelectItem value="暂无工作">暂无工作</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>教育程度</Label>
                <Select value={profile.education} onValueChange={(value) => updateProfile("education", value)}>
                  <SelectTrigger className="w-full rounded-xl h-12">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior_high">初中</SelectItem>
                    <SelectItem value="high_school">高中</SelectItem>
                    <SelectItem value="college">专科</SelectItem>
                    <SelectItem value="bachelor">本科</SelectItem>
                    <SelectItem value="master">硕士</SelectItem>
                    <SelectItem value="phd">博士</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>感情状况</Label>
                <Select value={profile.relationship} onValueChange={(value) => updateProfile("relationship", value)}>
                  <SelectTrigger className="w-full rounded-xl h-12">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">单身</SelectItem>
                    <SelectItem value="dating">恋爱中</SelectItem>
                    <SelectItem value="married">已婚</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center text-sm">
                  2
                </div>
                偏好设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interests">兴趣爱好</Label>
                <Textarea
                  id="interests"
                  placeholder={
                    profile.age < 18 
                      ? "描述一下您的兴趣爱好，如：阅读、运动、游戏、音乐、绘画、科技等"
                      : "描述一下您的兴趣爱好，如：阅读、运动、音乐、旅行等"
                  }
                  value={profile.interests}
                  onChange={(e) => updateProfile("interests", e.target.value)}
                  className="w-full rounded-xl min-h-[80px]"
                />
              </div>

              {/* 根据职业和教育程度显示工作/学习方式偏好 */}
              {(profile.occupation && !["初中生", "高中生", "中职学生"].includes(profile.occupation) && 
                !(profile.occupation === "学生" && ["high_school", ""].includes(profile.education))) && (
                <div className="space-y-2">
                  <Label>
                    {profile.occupation === "学生" || profile.age < 18 ? "学习方式偏好" : "工作方式偏好"}
                  </Label>
                  <Select value={profile.workStyle} onValueChange={(value) => updateProfile("workStyle", value)}>
                    <SelectTrigger className="w-full rounded-xl h-12">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      {profile.occupation === "学生" || profile.age < 18 ? (
                        <>
                          <SelectItem value="individual">独立学习/作业</SelectItem>
                          <SelectItem value="team">小组合作</SelectItem>
                          <SelectItem value="mixed">两者兼有</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="individual">独立工作</SelectItem>
                          <SelectItem value="team">团队协作</SelectItem>
                          <SelectItem value="mixed">两者兼有</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>{profile.age < 18 || ["初中生", "高中生", "中职学生"].includes(profile.occupation) ? "学习压力水平" : "日常压力水平"}</Label>
                <Select value={profile.stressLevel} onValueChange={(value) => updateProfile("stressLevel", value)}>
                  <SelectTrigger className="w-full rounded-xl h-12">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {profile.age < 18 || ["初中生", "高中生", "中职学生"].includes(profile.occupation) ? (
                      <>
                        <SelectItem value="low">轻松，学习压力不大</SelectItem>
                        <SelectItem value="medium">一般，有些学习压力</SelectItem>
                        <SelectItem value="high">较高，学习任务繁重</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="low">较低</SelectItem>
                        <SelectItem value="medium">中等</SelectItem>
                        <SelectItem value="high">较高</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>社交偏好</Label>
                <Select value={profile.socialPreference} onValueChange={(value) => updateProfile("socialPreference", value)}>
                  <SelectTrigger className="w-full rounded-xl h-12">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {profile.age < 18 ? (
                      <>
                        <SelectItem value="quiet">偏好安静环境，喜欢独处</SelectItem>
                        <SelectItem value="social">喜欢和朋友一起活动</SelectItem>
                        <SelectItem value="balanced">两者平衡，看情况而定</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="quiet">偏好安静环境</SelectItem>
                        <SelectItem value="social">喜欢社交活动</SelectItem>
                        <SelectItem value="balanced">两者平衡</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  onClick={saveProfile}
                  variant="outline" 
                  className={cn(
                    "w-full rounded-xl transition-all",
                    saved && "border-emerald-500 text-emerald-600"
                  )}
                >
                  {saved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      已保存
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存资料
                    </>
                  )}
                </Button>

                <Button 
                  onClick={startTest}
                  disabled={!isComplete}
                  className={cn(
                    "w-full rounded-xl",
                    isComplete 
                      ? "bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white hover:from-fuchsia-600 hover:to-rose-600" 
                      : "opacity-50 cursor-not-allowed"
                  )}
                >
                  开始个性化测试
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>隐私保护：</strong>您的个人信息仅用于个性化测试体验，数据存储在您的设备本地，不会上传至服务器。
              您可以随时修改或删除这些信息。
            </p>
          </CardContent>
        </Card>
      </main>
    </GradientBg>
  )
}