'use client'
import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import {
  buildPageBuilder,
  getMosaicParent,
  MosaicQuestion,
  PublicodesQuestion,
  QuestionContainer,
} from '@abc-transitionbascarbone/publicodes/form'
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Button, Card, CardContent, Container, LinearProgress, Typography } from '@mui/material'
import { EvaluatedFormElement, FormBuilder, FormPageElementProp, FormState } from '@publicodes/forms'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Category from './Category/Category'
import styles from './Survey.module.css'

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

export default function Survey({ surveyId, rootRule = 'bilan' }: MipSurveyProps) {
  const t = useTranslations('survey')
  const tCommon = useTranslations('common')
  const { engine } = useMipPublicodes()

  const formBuilder = useMemo(
    () =>
      new FormBuilder({
        engine,
        pageBuilder: buildPageBuilder(engine),
      }),
    [engine],
  )

  const initState = useCallback(() => {
    let s = FormBuilder.newState()
    s = formBuilder.start(s, rootRule)
    return s
  }, [formBuilder, rootRule])

  const [isResumed, setIsResumed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [state, setState] = useState<FormState<string>>(initState)

  useEffect(() => {
    const saved = loadState(surveyId)
    if (saved) {
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

  const updateState = useCallback((newState: FormState<string>) => {
    setState(newState)
  }, [])

  const handleRestart = () => {
    localStorage.removeItem(getStorageKey(surveyId))
    setIsResumed(false)
    setState(initState())
  }

  const { elements } = formBuilder.currentPage(state)
  const { current, pageCount, hasNextPage, hasPreviousPage } = formBuilder.pagination(state)
  const isComplete = !hasNextPage && current === pageCount

  const progress = useMemo(() => Math.round((current / pageCount) * 100), [current, pageCount])

  type GroupedElement =
    | { type: 'single'; el: EvaluatedFormElement<string> & FormPageElementProp }
    | { type: 'mosaic'; parent: string; elements: Array<EvaluatedFormElement<string> & FormPageElementProp> }

  const groupedElements = useMemo<GroupedElement[]>(() => {
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
        result.push({ type: 'single', el })
      }
    }
    return result
  }, [elements, engine])

  const currentTitle = useMemo(() => {
    const getCategoryKey = (ruleName: string) => {
      return ruleName.split(' . ')[0]
    }
    if (groupedElements[0]?.type === 'mosaic') {
      const parent = groupedElements[0].parent
      const key = getCategoryKey(parent)
      const raw = engine.getParsedRules()[key]?.rawNode as any

      return {
        label: raw?.titre,
        icons: raw?.icônes,
      }
    }
    if (groupedElements[0]?.type === 'single') {
      const el = groupedElements[0].el
      const key = getCategoryKey(el.id)
      const raw = engine.getParsedRules()[key]?.rawNode as any
      console.log('raw', raw)
      return {
        label: raw?.titre,
        icons: raw?.icônes,
      }
    }
    return { label: '', icons: undefined }
  }, [groupedElements, engine])

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
      <Container maxWidth="md" className={styles.container}>
        <Card>
          <CardContent>
            <div className={styles.completedContent}>
              <Check className={styles.checkIcon} />
              <Typography variant="h4" gutterBottom>
                {t('completed.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {t('completed.description')}
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" className={styles.container}>
      <div className={styles.header}>
        <Category title={currentTitle.label} icons={currentTitle.icons} />
        <div className={styles.progress}>
          <div className={styles.progressLabels}>
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

      <div className={styles.questionCard}>
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
            <QuestionContainer key={group.el.id} label={group.el.label ?? group.el.id}>
              <PublicodesQuestion
                key={group.el.id}
                formLayout={{
                  type: 'input',
                  evaluatedElement: group.el,
                  rule: group.el.id as string,
                }}
                onChange={(ruleName, value) => updateState(formBuilder.handleInputChange(state, ruleName, value))}
              />
              {/* <InputField
                  formElement={group.el}
                  onChange={(ruleName, value) =>
                    updateState(formBuilder.handleInputChange(state, ruleName, value))
                  } */}
              {/* /> */}
            </QuestionContainer>
          ),
        )}
      </div>

      <div className={styles.navigation}>
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
        {hasNextPage ? (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => updateState(formBuilder.goToNextPage(state))}
          >
            {tCommon('next')}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            endIcon={<Check />}
            onClick={() => updateState(formBuilder.goToNextPage(state))}
          >
            {t('navigation.complete')}
          </Button>
        )}
      </div>
    </Container>
  )
}
