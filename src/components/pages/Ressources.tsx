import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import RessourceLinks from '../ressources/RessourceLinks'
import styles from './Ressources.module.css'

const RessourcesPage = async () => {
  const t = await getTranslations('ressources')

  const ressources = [
    {
      title: 'methodeAssociative',
      links: [
        {
          title: 'sphereAssociative',
          link: 'https://www.plancarbonegeneral.com/approches-sectorielles/sphere-associative',
        },
      ],
    },
    {
      title: 'enSavoirPlusBilan',
      links: [{ title: 'methodeBilanCarbone', link: 'https://www.bilancarbone-methode.com' }],
    },
    {
      title: 'questionMethodo',
      links: [
        { title: 'openCarbonPractice', link: 'https://www.opencarbonpractice.com/rejoindre-la-communaute' },
        { title: 'contacterViaFormulaire', link: 'https://abc-transitionbascarbone.fr/contact-et-hotline' },
      ],
    },
    {
      title: 'questionTechnique',
      links: [
        { title: 'lireLaFAQ', link: 'https://association-pour-la-transition-1.gitbook.io/bc+' },
        { title: 'ecrireMail', link: 'mailto:support@abc-transitionbascarbone.fr' },
      ],
    },
  ]

  return (
    <>
      <Block title={t('title')} as="h1">
        <div className={styles.ressources}>
          {ressources.map(({ title, links }) => (
            <RessourceLinks key={title} title={title} links={links} />
          ))}
        </div>
      </Block>
    </>
  )
}

export default RessourcesPage
