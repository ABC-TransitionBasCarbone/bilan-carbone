'use client'

import Block from '@abc-transitionbascarbone/common/components/base/Block'
import { Button } from '@abc-transitionbascarbone/common/ui'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import HomeCard, { HomeCardItem } from './HomeCard'
import styles from './HomeCards.module.css'
import HomeCardsFilters from './HomeCardsFilters'

type Props = {
  items: HomeCardItem[]
} & ({ type: 'clients'; canCreateOrga: boolean } | { type: 'sessions'; canCreateOrga?: never })

const HomeCards = ({ items, type, canCreateOrga }: Props) => {
  const t = useTranslations()
  const [showAll, setShowAll] = useState(false)
  const [hiddenRows, setHiddenRows] = useState(false)
  const [visibleItems, setVisibleItems] = useState(items)
  const gridRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const checkHiddenRows = () => {
      if (gridRef.current) {
        const hasHiddenRows = Array.from(gridRef.current.children).some((card) => card.clientHeight === 0)
        setHiddenRows(hasHiddenRows)
      }
    }

    checkHiddenRows()
    window.addEventListener('resize', checkHiddenRows)
    return () => window.removeEventListener('resize', checkHiddenRows)
  }, [visibleItems])

  return (
    <Block
      title={type === 'clients' ? t('organization.myOrganizations') : t('courseSessions.title')}
      data-testid="home-cards-list"
      actions={
        canCreateOrga
          ? [
              {
                actionType: 'link',
                href: '/organisations/creer',
                ['data-testid']: 'new-organization',
                children: t('organization.create'),
              },
            ]
          : []
      }
    >
      <HomeCardsFilters type={type} items={items} setVisibleItems={setVisibleItems} />
      {!visibleItems.length && <p role="status">{t('homeCards.noResults')}</p>}
      <ul
        id="home-cards-grid"
        ref={gridRef}
        className={classNames(styles.grid, 'mb1', { [styles.hideSubRows]: !showAll })}
      >
        {visibleItems.map((item) => (
          <HomeCard key={item.id} item={item} type={type} />
        ))}
      </ul>
      {hiddenRows && (
        <Button onClick={() => setShowAll(!showAll)}>
          {t(showAll ? 'organization.seeLess' : 'organization.seeMore')}
        </Button>
      )}
    </Block>
  )
}

export default HomeCards
