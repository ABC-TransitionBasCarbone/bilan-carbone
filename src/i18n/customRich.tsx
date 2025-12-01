import { Translations } from '@/types/translation'
import { ReactNode } from 'react'

type CustomRichParams = {
  [key: string]: ((children: ReactNode) => ReactNode) | string
}

export const customRich = (t: Translations, key: string, params?: CustomRichParams) =>
  t.rich(key, {
    error: (children) => <span className="error">{children}</span>,
    b: (children) => <span className="bold">{children}</span>,
    i: (children) => <span className="italic">{children}</span>,
    br: () => <br />,
    ...params,
  })
