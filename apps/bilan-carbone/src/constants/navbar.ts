import { isCut, isTilt } from '@/services/permissions/environment'
import { hasAccessToEngagementActions, isTiltSimplified } from '@/services/permissions/environmentAdvanced'
import { Translations } from '@/types/translation'
import { Environment } from '@repo/db-common/enums'

interface MenuLink {
  href: string
  label: string
  testId?: string
  disabled?: boolean
  external?: boolean
  hide?: boolean
  info?: string
}

interface MenuSection {
  header?: string
  links: MenuLink[]
}

interface Menu {
  title: MenuLink
  sections: MenuSection[]
}

export const CLICKS_ON_ACT_INFO =
  "Construisez votre plan de transition avec Clicks On Act. En cliquant sur ce lien, un nouvel onglet va s'ouvrir."

export const getStudyNavbarMenu = (
  environment: Environment,
  t: Translations,
  studyId: string,
  studyName: string,
  isTransitionPlanActive: boolean = false,
  hasObjectives: boolean = false,
  studySimplified: boolean = false,
): Menu => {
  if (isCut(environment) || isTiltSimplified(environment, studySimplified)) {
    return {
      title: {
        href: `/etudes/${studyId}`,
        label: t('title'),
      },
      sections: [
        {
          links: [
            {
              href: `/etudes/${studyId}/cadrage`,
              label: isTilt(environment) ? t('generalData') : t('framing'),
              testId: 'study-cadrage-link',
            },
            {
              href: `/etudes/${studyId}/comptabilisation/saisie-des-donnees`,
              label: t('dataEntry'),
            },
            {
              href: `/etudes/${studyId}/comptabilisation/resultats`,
              label: t('results'),
            },
          ],
        },
      ],
    }
  }

  if (environment === Environment.CLICKSON) {
    return {
      title: {
        href: `/etudes/${studyId}`,
        label: studyName,
      },
      sections: [
        {
          header: t('informationDefinition'),
          links: [
            {
              href: `/etudes/${studyId}/cadrage`,
              label: t('framing'),
              testId: 'study-cadrage-link',
            },
          ],
        },
        {
          header: t('dataAccounting'),
          links: [
            {
              href: `/etudes/${studyId}/comptabilisation/saisie-des-donnees`,
              label: t('dataEntry'),
            },
            {
              href: `/etudes/${studyId}/comptabilisation/resultats`,
              label: t('results'),
            },
          ],
        },
        {
          header: t('transitionPlan'),
          links: [
            {
              href: 'https://transition.clickson.eu',
              label: 'Clicks On Act',
              external: true,
              info: CLICKS_ON_ACT_INFO,
            },
          ],
        },
      ],
    }
  }

  return {
    title: {
      href: `/etudes/${studyId}`,
      label: studyName,
    },
    sections: [
      {
        header: t('engagement'),
        links: [
          {
            disabled: !hasAccessToEngagementActions(environment, studySimplified),
            href: `/etudes/${studyId}/actions-de-mobilisation`,
            label: t('carriedActions'),
          },
        ],
      },
      {
        header: t('informationDefinition'),
        links: [
          {
            href: `/etudes/${studyId}/cadrage`,
            label: t('framing'),
            testId: 'study-cadrage-link',
          },
          {
            href: `/etudes/${studyId}/perimetre`,
            label: t('scope'),
            testId: 'study-perimetre-link',
          },
        ],
      },
      {
        header: t('dataAccounting'),
        links: [
          {
            href: `/etudes/${studyId}/comptabilisation/saisie-des-donnees`,
            label: t('dataEntry'),
          },
          {
            href: `/etudes/${studyId}/comptabilisation/resultats`,
            label: t('results'),
          },
        ],
      },
      {
        header: t('transitionPlan'),
        links: isTransitionPlanActive
          ? [
              {
                href: `/etudes/${studyId}/initialisation`,
                label: t('initialization'),
                testId: 'study-initialization-link',
              },
              {
                disabled: !hasObjectives,
                href: hasObjectives ? `/etudes/${studyId}/trajectoires` : '#',
                label: t('trajectories'),
                testId: 'study-trajectories-link',
              },
              {
                disabled: !hasObjectives,
                href: hasObjectives ? `/etudes/${studyId}/actions` : '#',
                label: t('actionPlan'),
                testId: 'study-action-plan-link',
              },
            ]
          : [
              {
                disabled: true,
                href: '#',
                label: t('commingSoon'),
              },
            ],
      },
    ],
  }
}
