import { useTranslations } from 'next-intl'

export const handleWarningText = (t: ReturnType<typeof useTranslations>, text: string) => {
  return <span>{t.rich(text, { warning: (children) => <span className="userWarning">{children}</span> })}</span>
}
