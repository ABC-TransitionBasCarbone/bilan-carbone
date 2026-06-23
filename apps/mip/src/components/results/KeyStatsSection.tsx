'use client'

import { KeyStatGroup } from '@/data/sampleResults'
import publicodesModel from '@/publicodes/publicodes-mip.model.json'
import { Card, CardContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import KeyStatGroupItem from './KeyStatGroupItem'
import styles from './KeyStatsSection.module.css'

interface Props {
  keyStats: KeyStatGroup[]
}

type PublicodesRule = {
  question?: string | null
} | null

const questionRuleByStatKey: Record<string, string> = {
  plane: 'transport . avion . présent',
  longHaulPlane: 'transport . avion . long courrier . heures de vol',
  carKm: 'DT . voiture . km',
  carPassengers: 'DT . voiture . voyageurs',
  electricHeating: 'logement . chauffage . électricité . présent',
  gasHeating: 'logement . chauffage . gaz . présent',
  oilHeating: 'logement . chauffage . fioul . présent',
  woodHeating: 'logement . chauffage . bois . présent',
  airConditioning: 'logement . climatisation . présent',
  vegan: 'alimentation . plats . végétalien . nombre',
  redMeatDaily: 'alimentation . plats . viande rouge . nombre',
  localSeasonal: 'alimentation . de saison . consommation',
  bottledWater: 'alimentation . boisson . eau en bouteille . consommateur',
  zeroWaste: 'alimentation . déchets . gestes',
  newClothes: 'divers . autres produits . niveau de dépenses',
}

const publicodesRules = publicodesModel as Record<string, PublicodesRule>

const KeyStatsSection = ({ keyStats }: Props) => {
  const t = useTranslations('results')

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('keyStats.title')}
      </Typography>
      <Card>
        <CardContent className="p15">
          <div className={styles.keyStatsGrid}>
            {keyStats.map((group) => (
              <KeyStatGroupItem
                key={group.key}
                group={group}
                statQuestions={Object.fromEntries(
                  group.stats
                    .map((stat) => {
                      const question = publicodesRules[questionRuleByStatKey[stat.key]]?.question
                      return typeof question === 'string' ? [stat.key, question] : null
                    })
                    .filter((entry): entry is [string, string] => entry !== null),
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default KeyStatsSection
