import { customRich } from '@/i18n/customRich'
import { Translations } from '@repo/lib'

export const handleWarningText = (t: Translations, text: string) => {
  return <span>{customRich(t, text, { warning: (children) => <span className="userWarning">{children}</span> })}</span>
}
