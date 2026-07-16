import { Translations } from '@abc-transitionbascarbone/lib'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'

export const handleWarningText = (t: Translations, text: string) => {
  return <span>{customRich(t, text, { warning: (children) => <span className="userWarning">{children}</span> })}</span>
}
