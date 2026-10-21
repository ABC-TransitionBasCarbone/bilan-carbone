import { Environment } from '@abc-transitionbascarbone/common/db/enums'
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

  it('uses Tilt labels for simplified COURSE_TILT studies', () => {
    const t = ((key: string) => key) as unknown as Parameters<typeof getStudyNavbarMenu>[1]
    const menu = getStudyNavbarMenu(Environment.COURSE_TILT, t, 'study-id', 'My study', false, false, true)

    expect(menu.sections[0].links[0].label).toBe('generalData')
  })
})
