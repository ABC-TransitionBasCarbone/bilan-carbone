import { Environment } from '@repo/db-common/enums'
import { getStudyNavbarMenu } from './navbar'

describe('getStudyNavbarMenu', () => {
  it('adds an info bubble content to Clicks On Act link in CLICKSON menu', () => {
    const t = ((key: string) => key) as any
    const menu = getStudyNavbarMenu(Environment.CLICKSON, t, 'study-id', 'My study')

    const transitionSection = menu.sections.find((section) => section.header === 'transitionPlan')
    expect(transitionSection).toBeDefined()

    const clicksOnActLink = transitionSection?.links[0]
    expect(clicksOnActLink).toMatchObject({
      href: 'https://transition.clickson.eu',
      label: 'Clicks On Act',
      external: true,
      info: "Construisez votre plan de transition avec Clicks On Act. En cliquant sur ce lien, un nouvel onglet va s'ouvrir.",
    })
  })
})
