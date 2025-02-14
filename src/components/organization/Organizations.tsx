'use client'

import { Organization } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import Block from '../base/Block'
import Button from '../base/Button'
import OrganizationCard from './Organization'
import styles from './Organizations.module.css'

interface Props {
  organizations: Organization[]
}

const Organizations = ({ organizations }: Props) => {
  const t = useTranslations('organization')
  const [showAll, setShowAll] = useState(false)
  const [itemsPerRow, setItemsPerRow] = useState(0)

  const visibleItems = useMemo(
    () => organizations.slice(0, showAll ? organizations.length : itemsPerRow),
    [itemsPerRow, organizations, showAll],
  )

  const toggleShowAll = () => setShowAll(!showAll)

  const handleResize = () => {
    const container = document.querySelector('#organization-grid')
    if (container) {
      /**
       * Calcul explanation :
       * Each card is 10rem wide + 0.5rem gap -> 10.5 * 16 (cf grid css class)
       * The total width is the containers width + 0.5rem (no gap after the last item)
       */
      setItemsPerRow(Math.floor((container.clientWidth + 8) / (10.5 * 16)))
    }
  }

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [organizations, itemsPerRow, showAll])

  return (
    <Block
      title={t('myOrganizations')}
      data-testid="home-organizations"
      actions={[
        {
          actionType: 'link',
          href: '/organisations/creer',
          ['data-testid']: 'new-organization',
          children: t('create'),
        },
      ]}
    >
      <ul id="organization-grid" className={classNames(styles.grid, 'mb1')}>
        {visibleItems.map((organization) => (
          <OrganizationCard key={organization.id} organization={organization} />
        ))}
      </ul>
      <Button onClick={toggleShowAll} color="secondary">
        {t(showAll ? 'seeLess' : 'seeMore')}
      </Button>
    </Block>
  )
}

export default Organizations
