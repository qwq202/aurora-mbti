import { redirect } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

export default function AboutRedirectPage() {
  redirect({ href: '/about', locale: routing.defaultLocale })
}
