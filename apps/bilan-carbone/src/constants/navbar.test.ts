import { Environment } from '@repo/db-common/enums'
import { CLICKS_ON_ACT_INFO, getStudyNavbarMenu } from './navbar'

describe('getStudyNavbarMenu', () => {
  it('adds an info bubble content to Clicks On Act link in CLICKSON menu', () => {
    const t = ((key: string) => key) as unknown as Parameters<typeof getStudyNavbarMenu>[1]
    const menu = getStudyNavbarMenu(Environment.CLICKSON, t, 'study-id', 'My study')

    const transitionSection = menu.sections.find((section) => section.header === 'transitionPlan')
    expect(transitionSection).toBeDefined()

    const clicksOnActLink = transitionSection?.links[0]
    expect(clicksOnActLink).toMatchObject({
      href: 'https://transition.clickson.eu',
      label: 'Clicks On Act',
      external: true,
      info: CLICKS_ON_ACT_INFO,
    })
  })
})
