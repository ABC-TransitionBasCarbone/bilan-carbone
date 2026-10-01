import { GroupedElement } from '@/components/survey/surveyGrouping'
import { createMipEngine } from '@/publicodes/mip-engine'
import { InputQuestion, MosaicQuestion } from '@abc-transitionbascarbone/publicodes/form'
import { Alert } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'

type MipEngine = ReturnType<typeof createMipEngine>

interface Props {
  groupedElements: GroupedElement[]
  engine: MipEngine
  setValue: (ruleName: string, value: string | number | boolean | undefined) => void
}

const SurveyQuestionList = ({ groupedElements, engine, setValue }: Props) => {
  const t = useTranslations('survey')

  return (
    <div className="p0">
      {groupedElements.map((group) =>
        group.type === 'mosaic' ? (
          <Fragment key={group.parent}>
            {group.plancherWarning && (
              <Alert severity="warning">{t('warning.plancher', { message: group.plancherWarning })}</Alert>
            )}
            <MosaicQuestion
              parent={group.parent}
              elements={group.elements}
              engine={engine}
              containerVariant="flat"
              defaultAsPlaceholder
              onChange={(ruleName, value) => setValue(ruleName, value)}
            />
          </Fragment>
        ) : (
          <Fragment key={group.el.id}>
            {group.plancherWarning && (
              <Alert severity="warning">{t('warning.plancher', { message: group.plancherWarning })}</Alert>
            )}
            <InputQuestion
              formElement={group.el}
              engine={engine}
              containerVariant="flat"
              defaultAsPlaceholder
              onChange={(ruleName, value) => setValue(ruleName, value)}
            />
          </Fragment>
        ),
      )}
    </div>
  )
}

export default SurveyQuestionList
