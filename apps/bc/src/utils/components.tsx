import { Translations } from '@abc-transitionbascarbone/common'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'

export const handleWarningText = (t: Translations, text: string) => {
  return <span>{customRich(t, text, { warning: (children) => <span className="userWarning">{children}</span> })}</span>
}
