import { Translations } from '@abc-transitionbascarbone/application/lib'
import { customRich } from '@abc-transitionbascarbone/shared/utils/customRich'

export const handleWarningText = (t: Translations, text: string) => {
  return <span>{customRich(t, text, { warning: (children) => <span className="userWarning">{children}</span> })}</span>
}
