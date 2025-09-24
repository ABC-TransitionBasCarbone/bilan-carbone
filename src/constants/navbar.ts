import { Translations } from '@/types/translation'
import { Environment } from '@prisma/client'

interface MenuLink {
  href: string
  label: string
  testId?: string
  disabled?: boolean
}

interface MenuSection {
  header?: string
  links: MenuLink[]
}

interface Menu {
  title: MenuLink
  sections: MenuSection[]
}

export const getStudyNavbarMenu = (
  environment: Environment,
  t: Translations,
  studyId: string,
  studyName: string,
): Menu => {
  if (environment === Environment.CUT) {
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
              label: t('framing'),
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
        header: t('mobilisation'),
        links: [
          {
            href: '#',
            label: t('commingSoon'),
            disabled: true,
          },
        ],
      },
      {
        header: t('transitionPlan'),
        links: [
          {
            href: '#',
            label: t('commingSoon'),
            disabled: true,
          },
        ],
      },
    ],
  }
}
