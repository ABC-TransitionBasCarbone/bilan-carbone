import { Translations } from '@/types/translation'

export const handleWarningText = (t: Translations, text: string) => {
  return <span>{t.rich(text, { warning: (children) => <span className="userWarning">{children}</span> })}</span>
}
