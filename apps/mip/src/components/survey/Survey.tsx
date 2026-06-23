'use client'
import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import { createResponseWithJson } from '@/services/serverFunctions/campaign'
import {
  buildPageBuilder,
  getMosaicParent,
  getQuestionType,
  InputQuestion,
  MipQuestionType,
  MosaicQuestion,
  patchFormElement,
} from '@abc-transitionbascarbone/publicodes/form'
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Button, Container, LinearProgress, Typography } from '@mui/material'
import { EvaluatedFormElement, FormBuilder, FormPageElementProp, FormState } from '@publicodes/forms'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Category from './Category/Category'
import styles from './Survey.module.css'
import SurveyCompletion from './SurveyCompletion'

function getStorageKey(surveyId: string) {
  return `mip-publicodes-state-${surveyId}`
}

function saveState(surveyId: string, state: FormState<string>) {
  localStorage.setItem(getStorageKey(surveyId), JSON.stringify(state))
}

function loadState(surveyId: string): FormState<string> | null {
  try {
    const raw = localStorage.getItem(getStorageKey(surveyId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface MipSurveyProps {
  surveyId: string
  rootRule?: string
}

type GroupedElement =
  | { type: 'single'; el: EvaluatedFormElement<string> & FormPageElementProp; questionType: MipQuestionType }
  | { type: 'mosaic'; parent: string; elements: Array<EvaluatedFormElement<string> & FormPageElementProp> }

export default function Survey({ surveyId, rootRule = 'bilan' }: MipSurveyProps) {
  const t = useTranslations('survey')
  const tCommon = useTranslations('common')
  const { engine } = useMipPublicodes()

  const formBuilder = new FormBuilder({
    engine,
    pageBuilder: buildPageBuilder(engine),
  })

  function initState() {
    let s = FormBuilder.newState()
    s = formBuilder.start(s, rootRule)
    return s
  }

  const [isResumed, setIsResumed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [state, setState] = useState<FormState<string>>(initState)
  const updateState = (newState: FormState<string>) => setState(newState)

  useEffect(() => {
    const saved = loadState(surveyId)
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(saved)
      setIsResumed(true)
    }
    setIsLoading(false)
  }, [surveyId])

  useEffect(() => {
    if (!isLoading) {
      saveState(surveyId, state)
    }
  }, [surveyId, state, isLoading])

  const handleRestart = () => {
    localStorage.removeItem(getStorageKey(surveyId))
    setIsResumed(false)
    setState(initState())
  }

  const completeSurvey = () => {
    updateState(formBuilder.goToNextPage(state))
    createResponseWithJson(surveyId, JSON.stringify(state))
  }

  const { elements } = formBuilder.currentPage(state)
  const { current, pageCount, hasNextPage, hasPreviousPage } = formBuilder.pagination(state)
  const isComplete = !hasNextPage && current === pageCount
  const progress = Math.round((current / pageCount) * 100)

  function getGroupedElements(): GroupedElement[] {
    const result: GroupedElement[] = []
    const seen = new Set<string>()

    for (const el of elements) {
      const mosaicParent = getMosaicParent(engine, el.id)
      if (mosaicParent) {
        if (!seen.has(mosaicParent)) {
          seen.add(mosaicParent)
          result.push({
            type: 'mosaic',
            parent: mosaicParent,
            elements: elements.filter((e) => getMosaicParent(engine, e.id) === mosaicParent),
          })
        }
      } else {
        result.push({
          type: 'single',
          el: patchFormElement(el, getQuestionType(engine, el.id)),
          questionType: getQuestionType(engine, el.id),
        })
      }
    }
    return result
  }

  const groupedElements = getGroupedElements()

  function getCurrentTitle() {
    const getCategoryKey = (ruleName: string) => ruleName.split(' . ')[0]

    if (groupedElements[0]?.type === 'mosaic') {
      const key = getCategoryKey(groupedElements[0].parent)
      const raw = engine.getParsedRules()[key]?.rawNode
      return { label: raw?.titre, icons: raw?.icônes }
    }
    if (groupedElements[0]?.type === 'single') {
      const key = getCategoryKey(groupedElements[0].el.id)
      const raw = engine.getParsedRules()[key]?.rawNode
      return { label: raw?.titre, icons: raw?.icônes }
    }
    return { label: '', icons: undefined }
  }

  const currentTitle = getCurrentTitle()

  if (isLoading) {
    return <Typography>{t('loading')}</Typography>
  }

  if (isResumed) {
    return (
      <Container maxWidth="md">
        <Typography variant="h4">{t('resume')}</Typography>
        <div>
          <Button variant="outlined" onClick={handleRestart}>
            {t('navigation.restart')}
          </Button>
          <Button variant="contained" onClick={() => setIsResumed(false)}>
            {t('navigation.continue')}
          </Button>
        </div>
      </Container>
    )
  }

  if (isComplete) {
    return (
      <Container maxWidth="md" className={classNames(styles.container, 'pt2')}>
        <Card>
          <CardContent>
            <div className={classNames(styles.completedContent, 'py2')}>
              <Check className={classNames(styles.checkIcon, 'mb1')} />
              <Typography variant="h4" gutterBottom>
                {t('completed.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {t('completed.description')}
              </Typography>
              <Button variant="contained" href={`/survey/${surveyId}/results`}>
                {t('completed.viewResults')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" className={classNames(styles.container, 'pt2')}>
      <div className="mb2">
        <Category title={currentTitle.label} icons={currentTitle.icons} />
        <div className="mb2">
          <div className="justify-between mb-2">
            <Typography variant="body2" color="text.secondary">
              {t('progress.question', {
                current: Math.min(current, pageCount),
                total: pageCount,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('progress.complete', { percent: progress })}
            </Typography>
          </div>
          <LinearProgress variant="determinate" value={progress} />
        </div>
      </div>

      <div className="mb2">
        {groupedElements.map((group) =>
          group.type === 'mosaic' ? (
            <MosaicQuestion
              key={group.parent}
              parent={group.parent}
              elements={group.elements}
              engine={engine}
              onChange={(ruleName, value) => updateState(formBuilder.handleInputChange(state, ruleName, value))}
            />
          ) : (
            <InputQuestion
              key={group.el.id}
              formElement={group.el}
              engine={engine}
              onChange={(ruleName, value) => updateState(formBuilder.handleInputChange(state, ruleName, value))}
            />
          ),
        )}
      </div>

      <div className={classNames(styles.navigation, 'flex-cc', 'gapped1', 'py1', 'px2')}>
        {hasPreviousPage ? (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => updateState(formBuilder.goToPreviousPage(state))}
          >
            {tCommon('previous')}
          </Button>
        ) : (
          <div />
        )}
        {pageCount !== current + 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => updateState(formBuilder.goToNextPage(state))}
          >
            {tCommon('next')}
          </Button>
        ) : (
          <Button variant="contained" color="success" endIcon={<Check />} onClick={completeSurvey}>
            {t('navigation.complete')}
          </Button>
        )}
      </div>
    </Container>
  )
}
