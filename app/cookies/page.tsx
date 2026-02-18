import { redirect } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

export default function CookiesRedirectPage() {
  redirect({ href: '/cookies', locale: routing.defaultLocale })
}
