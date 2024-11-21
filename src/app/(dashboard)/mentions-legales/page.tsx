import Link from 'next/link'
import { useTranslations } from 'next-intl'
import styles from './styles.module.css'
import Block from '@/components/base/Block'

const contactMail = process.env.ABC_CONTACT_MAIL
const privacyPoliticsLink = process.env.ABC_PRIVACY_POLICY_LINK

const LegalNotices = () => {
  const t = useTranslations('legalNotices')
  return (
    <Block>
      <div className={styles.notices} data-testid="legal-notices">
        <div className="mb1">
          <Link data-testid="profile-link" href="/profil">
            {t('profile')}
          </Link>
        </div>

        <p>
          Conformément aux dispositions des articles 6-III et 19 de la loi pour la Confiance dans l’Économie Numérique,
          nous vous informons que ce site est édité par :
        </p>
        <h1 className={styles.section}>Association pour la transition Bas Carbone</h1>
        <p className="flex-col">
          <span>Association loi 1901 à but non lucratif</span>
          <span>SIRET : 538 170 093 00032</span>
          <span>Bureaux : 41 rue Beauregard – 75002 Paris – France</span>
          <span>Téléphone : 09 81 10 27 93</span>
          <span>
            Mail :{' '}
            <a data-testid="contact-mail" href={`mailto:${contactMail}`}>
              {contactMail}
            </a>
          </span>
          <span>N° d’identification à la TVA : FR 96 53 81 70 093</span>
        </p>

        <div className={styles.section}>Hébergeur </div>
        <p>OVH– 2 rue Kellermann - 59100 Roubaix - France</p>

        <div className={styles.section}>Propriétaire du site </div>
        <p>
          Le présent site est la propriété de l’Institut de Formation Carbone. Le contenu éditorial, textes, images
          composant le site web sont la propriété de l’Institut de Formation Carbone. Toute représentation totale ou
          partielle de ce site, par quelques procédés que ce soient, sans autorisation préalable de l’Institut de
          Formation Carbone, est interdite et constituerait une contrefaçon sanctionnée par les articles L335-2 et
          suivants du Code de la propriété intellectuelle. Tous les noms de produits ou de sociétés mentionnés dans le
          site web sont les marques de leurs titulaires.
        </p>
        <p>Responsable de publication : Anna Creti</p>

        <div className={styles.section}>Propriété intellectuelle et copyright </div>
        <p>
          L’ensemble des éléments du site (textes, documents…) sont, sauf dispositions contraires, la propriété
          intellectuelle exclusive de la société Institut de Formation Carbone. Par conséquent, toute reproduction,
          représentation, transmission, diffusion, partielle ou totale, est interdite selon les termes de l’article L.
          122-4 du CPI sous réserve des exceptions prévues à l’article L. 122-5 du CPI. Toute utilisation de données
          figurant sur ce site nécessite une autorisation préalable et expresse. A défaut, le délit de contrefaçon
          constitué est sanctionné sur le fondement des articles L. 335-2 et suivants du CPI.
        </p>
        <p>
          Pour toute exploitation autorisée de tout ou partie du contenu du site, faire figurer le nom de l’auteur, ses
          qualités, l’année de publication et la source.
        </p>
        <div className={styles.section}>Liens hypertextes </div>
        <p>
          L’éditeur ne saurait engager sa responsabilité sur le contenu des informations figurant sur les pages
          auxquelles les liens hypertextes du présent site renvoient.
        </p>
        <div className={styles.section}>Droits d’accès</div>
        <p>
          Conformément au Règlement (UE) 2016/679 relatif à la protection des données à caractère personnel, vous
          disposez sur vos données des droit d’accès, droit de rectification et du droit d’opposition. Pour en savoir
          plus, vous pouvez consulter notre{' '}
          <a data-testid="privacy-link" href={privacyPoliticsLink} target="_blank" rel="noreferrer">
            politique de protection des données
          </a>
          .
        </p>
        <div className={styles.section}>La marque Bilan Carbone ®</div>
        <p>
          La marque Bilan Carbone® est une marque déposée en France depuis le 2 décembre 2003, enregistrée sous le
          numéro 3260464.
        </p>
        <p>
          Tous droits de reproduction ou d’utilisation sont réservés s’agissant des représentations iconographiques et
          photographiques de la marque. La reproduction à des fins de diffusion ou d’exploitation de tout ou partie de
          la marque Bilan Carbone® n’est possible qu’avec l’autorisation expresse de l’Association pour la transition
          Bas Carbone. Le cas échéant, aucune modification de forme qui détournerait le sens et l’image Bilan Carbone®
          ne pourra être apportée. Un lien devra être établi vers l’Association pour la transition Bas Carbone.
        </p>
      </div>
    </Block>
  )
}

export default LegalNotices
