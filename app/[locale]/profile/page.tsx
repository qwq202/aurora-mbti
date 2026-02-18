"use client"

import { useEffect, useState } from "react"
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FadeIn, SlideUp } from "@/components/scroll-reveal"
import { type UserProfile } from "@/lib/mbti"
import { PROFILE_KEY } from "@/lib/constants"
import { useTimeout } from "@/hooks/use-cleanup"
import { validateProfile } from "@/lib/security"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"


export default function ProfilePage() {
  const t = useTranslations('profile')
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    age: 18,
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
  
  const { addTimeout } = useTimeout()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        setProfile(JSON.parse(saved) as UserProfile)
      }
    } catch (error) {
      console.warn(":", error)
    }
  }, [])

  const updateProfile = (field: keyof UserProfile, value: string | number) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value }
      
      if (field === 'occupation') {
        if (value === 'elementary') {
          updated.education = 'junior_high'
        } else if (value === 'middleSchool' || value === 'highSchool') {
          updated.education = 'high_school'
        } else if (value === 'student' && (!updated.education || updated.education === 'junior_high')) {
          updated.education = 'high_school'
        }
      }

      if (field === 'occupation' || field === 'education') {
        const isSchoolStudent =
          ["elementary", "middleSchool", "highSchool"].includes(updated.occupation) ||
          (updated.occupation === "student" && updated.age < 18)
        const shouldHideWorkStyle = 
          (updated.occupation && isSchoolStudent) ||
          (updated.occupation === "" && ["high_school", "junior_high"].includes(updated.education))
        
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
      const validationResult = validateProfile(profile)
      if (!validationResult.valid) {
        toast({
          title: "",
          description: validationResult.error,
          variant: "destructive",
        })
        return
      }
      
      localStorage.setItem(PROFILE_KEY, JSON.stringify(validationResult.sanitized))
      setSaved(true)
      addTimeout(() => setSaved(false), 2000)
    } catch (error) {
      toast({
        title: "",
        description: "",
        variant: "destructive",
      })
    }
  }

  const startTest = () => {
    if (!isComplete) return
    saveProfile()
    router.push("/test-mode?from=profile")
  }

  const isComplete = profile.name && profile.age && profile.gender && profile.occupation

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <SiteHeader />
      
      <main className="pt-48 pb-32">
        {/* --- Hero: Editorial Style --- */}
        <section className="px-6 lg:px-20 mb-24">
          <div className="max-w-7xl mx-auto border-b border-zinc-100 pb-20">
            <div className="max-w-4xl">
              <FadeIn>
                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-12">
                  {t('hero.label')}
                </div>
              </FadeIn>
              <SlideUp>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] mb-12">
                  {t('hero.title')} <br />
                  <span className="text-zinc-300">{t('hero.titleHighlight')}</span>
                </h1>
              </SlideUp>
              <SlideUp delay={200}>
                <p className="max-w-xl text-xl text-zinc-500 font-medium leading-relaxed">
                  {t('hero.description')}
                </p>
              </SlideUp>
            </div>
          </div>
        </section>

        {/* --- Form Section: Clean, Minimalist --- */}
        <section className="px-6 lg:px-20 mb-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-24 items-start">
              {/* Basic Info */}
              <div className="space-y-16">
                <div className="space-y-4">
                  <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">{t('basicInfo.label')}</div>
                  <h2 className="text-4xl font-bold tracking-tight">{t('basicInfo.title')}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="space-y-4">
                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('basicInfo.name')}</Label>
                    <Input
                      id="name"
                      placeholder={t('basicInfo.namePlaceholder')}
                      value={profile.name}
                      onChange={(e) => updateProfile("name", e.target.value)}
                      className="h-9 w-full bg-zinc-50 border-transparent  rounded-m font-medium"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('basicInfo.gender')}</Label>
                    <Select value={profile.gender} onValueChange={(value) => updateProfile("gender", value)}>
                      <SelectTrigger className="h-14 w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md px-4 font-medium">
                        <SelectValue placeholder={t('basicInfo.genderPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-zinc-100">
                        <SelectItem value="male">{t('basicInfo.genderOptions.male')}</SelectItem>
                        <SelectItem value="female">{t('basicInfo.genderOptions.female')}</SelectItem>
                        <SelectItem value="other">{t('basicInfo.genderOptions.other')}</SelectItem>
                        <SelectItem value="preferNotToSay">{t('basicInfo.genderOptions.preferNotToSay')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('basicInfo.age')}</Label>
                    <Select value={profile.age ? String(profile.age) : ""} onValueChange={(value) => updateProfile("age", parseInt(value) || 0)}>
                      <SelectTrigger className="h-14 w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md px-4 font-medium">
                        <SelectValue placeholder={t('basicInfo.agePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-zinc-100 h-64">
                        {Array.from({ length: 83 }, (_, i) => i + 13).map(age => (
                          <SelectItem key={age} value={String(age)}>
                            {age} {t('basicInfo.ageSuffix')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('basicInfo.occupation')}</Label>
                    <Select value={profile.occupation} onValueChange={(value) => updateProfile("occupation", value)}>
                      <SelectTrigger className="h-14 w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md px-4 font-medium">
                        <SelectValue placeholder={t('basicInfo.occupationPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-zinc-100 max-h-64">
                        {profile.age < 18 ? (
                          <>
                            <SelectItem value="student">{t('basicInfo.occupationOptions.student')}</SelectItem>
                            <SelectItem value="highSchool">{t('basicInfo.occupationOptions.highSchool')}</SelectItem>
                            <SelectItem value="middleSchool">{t('basicInfo.occupationOptions.middleSchool')}</SelectItem>
                            <SelectItem value="elementary">{t('basicInfo.occupationOptions.elementary')}</SelectItem>
                            <SelectItem value="other">{t('basicInfo.occupationOptions.other')}</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="student">{t('basicInfo.occupationOptions.student')}</SelectItem>
                            <SelectItem value="engineer">{t('basicInfo.occupationOptions.engineer')}</SelectItem>
                            <SelectItem value="designer">{t('basicInfo.occupationOptions.designer')}</SelectItem>
                            <SelectItem value="marketing">{t('basicInfo.occupationOptions.marketing')}</SelectItem>
                            <SelectItem value="sales">{t('basicInfo.occupationOptions.sales')}</SelectItem>
                            <SelectItem value="hr">{t('basicInfo.occupationOptions.hr')}</SelectItem>
                            <SelectItem value="management">{t('basicInfo.occupationOptions.management')}</SelectItem>
                            <SelectItem value="consultant">{t('basicInfo.occupationOptions.consultant')}</SelectItem>
                            <SelectItem value="other">{t('basicInfo.occupationOptions.other')}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('basicInfo.education')}</Label>
                    <Select value={profile.education} onValueChange={(value) => updateProfile("education", value)}>
                      <SelectTrigger className="h-14 w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md px-4 font-medium">
                        <SelectValue placeholder={t('basicInfo.educationPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-zinc-100">
                        <SelectItem value="junior_high">{t('basicInfo.educationOptions.juniorHigh')}</SelectItem>
                        <SelectItem value="high_school">{t('basicInfo.educationOptions.highSchool')}</SelectItem>
                        <SelectItem value="college">{t('basicInfo.educationOptions.college')}</SelectItem>
                        <SelectItem value="bachelor">{t('basicInfo.educationOptions.bachelor')}</SelectItem>
                        <SelectItem value="master">{t('basicInfo.educationOptions.master')}</SelectItem>
                        <SelectItem value="phd">{t('basicInfo.educationOptions.phd')}</SelectItem>
                        <SelectItem value="preferNotToSay">{t('basicInfo.educationOptions.preferNotToSay')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('basicInfo.relationship')}</Label>
                    <Select value={profile.relationship} onValueChange={(value) => updateProfile("relationship", value)}>
                      <SelectTrigger className="h-14 w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md px-4 font-medium">
                        <SelectValue placeholder={t('basicInfo.relationshipPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-zinc-100">
                        <SelectItem value="single">{t('basicInfo.relationshipOptions.single')}</SelectItem>
                        <SelectItem value="dating">{t('basicInfo.relationshipOptions.dating')}</SelectItem>
                        <SelectItem value="married">{t('basicInfo.relationshipOptions.married')}</SelectItem>
                        <SelectItem value="other">{t('basicInfo.relationshipOptions.other')}</SelectItem>
                        <SelectItem value="preferNotToSay">{t('basicInfo.relationshipOptions.preferNotToSay')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-16">
                <div className="space-y-4">
                  <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">{t('preferences.label')}</div>
                  <h2 className="text-4xl font-bold tracking-tight">{t('preferences.title')}</h2>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <Label htmlFor="interests" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('preferences.interests')}</Label>
                    <Textarea
                      id="interests"
                      placeholder={t('preferences.interestsPlaceholder')}
                      value={profile.interests}
                      onChange={(e) => updateProfile("interests", e.target.value)}
                      className="w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md p-4 min-h-[120px] font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('preferences.socialPreference')}</Label>
                      <Select value={profile.socialPreference} onValueChange={(value) => updateProfile("socialPreference", value)}>
                        <SelectTrigger className="h-14 w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md px-4 font-medium">
                          <SelectValue placeholder={t('preferences.socialPreferencePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-zinc-100">
                          <SelectItem value="quiet">{t('preferences.socialPreferenceOptions.quiet')}</SelectItem>
                          <SelectItem value="social">{t('preferences.socialPreferenceOptions.social')}</SelectItem>
                          <SelectItem value="balanced">{t('preferences.socialPreferenceOptions.balanced')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('preferences.stressLevel')}</Label>
                      <Select value={profile.stressLevel} onValueChange={(value) => updateProfile("stressLevel", value)}>
                        <SelectTrigger className="h-14 w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md px-4 font-medium">
                          <SelectValue placeholder={t('preferences.stressLevelPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-zinc-100">
                          <SelectItem value="low">{t('preferences.stressLevelOptions.low')}</SelectItem>
                          <SelectItem value="medium">{t('preferences.stressLevelOptions.medium')}</SelectItem>
                          <SelectItem value="high">{t('preferences.stressLevelOptions.high')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4 md:col-span-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('preferences.workStyle')}</Label>
                      <Select value={profile.workStyle} onValueChange={(value) => updateProfile("workStyle", value)}>
                        <SelectTrigger className="h-14 w-full bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-md px-4 font-medium">
                          <SelectValue placeholder={t('preferences.workStylePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-zinc-100">
                          <SelectItem value="individual">{t('preferences.workStyleOptions.individual')}</SelectItem>
                          <SelectItem value="team">{t('preferences.workStyleOptions.team')}</SelectItem>
                          <SelectItem value="mixed">{t('preferences.workStyleOptions.mixed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Action Bar: Clean, Centered --- */}
        <section className="px-6 lg:px-20">
          <div className="max-w-7xl mx-auto border-t border-zinc-100 pt-20 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-900" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-900">{t('privacy.title')}</span>
              </div>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                {t('privacy.description')}
              </p>
              <div className="space-y-2 mt-4">
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  {t('privacy.localStorage')}
                </p>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  {t('privacy.sensitiveInfo')}
                </p>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  {t('privacy.control')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={saveProfile}
                className={cn(
                  "h-16 px-10 text-xs font-bold tracking-widest uppercase transition-all rounded-md border",
                  saved 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                    : "border-zinc-100 text-zinc-400 hover:text-zinc-900 hover:border-zinc-900"
                )}
              >
                {saved ? t('actions.saved') : t('actions.save')}
              </button>

              <button 
                onClick={startTest}
                disabled={!isComplete}
                className="h-16 px-16 bg-zinc-900 text-white font-bold text-sm tracking-widest uppercase hover:bg-black transition-all active:scale-95 rounded-md disabled:opacity-20 disabled:pointer-events-none"
              >
                {t('actions.nextStep')}
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
