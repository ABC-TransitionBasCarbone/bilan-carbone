import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { getEnvVar } from '@abc-transitionbascarbone/lib/environment'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import styles from './styles.module.css'

const LegalNotices = async () => {
  const contactMail = await getEnvVar('CONTACT_EMAIL', Environment.BC)
  const t = await getTranslations('legalNotices')
  const locale = await getLocale()
  return (
    <Block>
      <div className={styles.notices} data-testid="legal-notices">
        <div className="mb1">
          <Link data-testid="profile-link" href="/profil">
            {t('profile')}
          </Link>
        </div>

        {locale === Locale.EN ? (
          <>
            <p>
              In accordance with the provisions of Articles 6-III and 19 of the French Law for Confidence in the Digital
              Economy (Loi pour la Confiance dans l'Économie Numérique), we inform you that this website is published
              by:
            </p>
            <h1 className={styles.section}>Association pour la transition Bas Carbone</h1>
            <p className="flex-col">
              <span>Non-profit association</span>
              <span>SIRET : 538 170 093 00032</span>
              <span>Office : 41 rue Beauregard – 75002 Paris – France</span>
              <span>Phone number : 09 81 10 27 93</span>
              <span>
                Mail :{' '}
                <a data-testid="contact-mail" href={`mailto:${contactMail}`}>
                  {contactMail}
                </a>
              </span>
              <span>VAT identification number : FR 96 53 81 70 093</span>
            </p>

            <div className={styles.section}>Provider</div>
            <p>Scalingo - 9 Rue de la Krutenau, 67000 Strasbourg</p>

            <div className={styles.section}>Website Owner</div>
            <p>
              This website is owned by the Association pour la transition bas carbone (Association for Low-Carbon
              Transition). All editorial content, texts, and images on this website are the property of the Association
              pour la transition bas carbone. Any full or partial reproduction of this site by any means without prior
              written permission from the Association pour la transition bas carbone is strictly prohibited and
              constitutes an infringement punishable under Articles L335-2 and following of the French Intellectual
              Property Code. All product or company names mentioned on this website are trademarks of their respective
              owners.
            </p>
            <p>Editor in Chief: Anna Creti</p>

            <div className={styles.section}>Intellectual Property and Copyright</div>
            <p>
              All elements of this website (texts, documents, etc.), unless otherwise stated, are the exclusive
              intellectual property of the Association pour la transition bas carbone. Therefore, any reproduction,
              representation, transmission, or distribution—whether partial or total—is prohibited under the terms of
              Article L. 122-4 of the French Intellectual Property Code, except as provided for in Article L. 122-5 of
              the same code. Any use of data published on this website requires prior and express authorization. Failure
              to obtain such authorization constitutes an act of infringement, punishable under Articles L. 335-2 and
              following of the French Intellectual Property Code.
            </p>
            <p>
              For any authorized use of all or part of the website's content, the author's name, title, year of
              publication, and source must be clearly indicated.
            </p>

            <div className={styles.section}>Hypertext Links</div>
            <p>
              The publisher cannot be held liable for the content of information appearing on pages accessed via
              hypertext links from this website.
            </p>

            <div className={styles.section}>Access Rights</div>
            <p>
              In accordance with the EU General Data Protection Regulation (GDPR) 2016/679, you have the right to
              access, rectify, and object to the processing of your personal data.
            </p>

            <div className={styles.section}>The Bilan Carbone® Trademark</div>
            <p>
              The Bilan Carbone® trademark has been registered in France since December 2, 2003, under number 3260464.
              All rights to reproduce or use the trademark's iconographic and photographic representations are reserved.
              Reproduction for the purpose of dissemination or exploitation of all or part of the Bilan Carbone®
              trademark is only possible with the express authorization of the Association pour la transition Bas
              Carbone. In such cases, no modifications that could alter the meaning or image of Bilan Carbone® may be
              made. A link to the Association pour la transition Bas Carbone must be included.
            </p>
          </>
        ) : (
          <>
            <p>
              Conformément aux dispositions des articles 6-III et 19 de la loi pour la Confiance dans l'Économie
              Numérique, nous vous informons que ce site est édité par :
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
              <span>N° d'identification à la TVA : FR 96 53 81 70 093</span>
            </p>

            <div className={styles.section}>Hébergeur </div>
            <p>Scalingo - 9 Rue de la Krutenau, 67000 Strasbourg</p>

            <div className={styles.section}>Propriétaire du site </div>
            <p>
              Le présent site est la propriété de l’Association pour la transition bas carbone. Le contenu éditorial,
              textes, images composant le site web sont la propriété de l’Association pour la transition bas carbone.
              Toute représentation totale ou partielle de ce site, par quelques procédés que ce soient, sans
              autorisation préalable de l’Association pour la transition bas carbone, est interdite et constituerait une
              contrefaçon sanctionnée par les articles L335-2 et suivants du Code de la propriété intellectuelle. Tous
              les noms de produits ou de sociétés mentionnés dans le site web sont les marques de leurs titulaires.
            </p>
            <p>Responsable de publication : Anna Creti</p>

            <div className={styles.section}>Propriété intellectuelle et copyright </div>
            <p>
              L’ensemble des éléments du site (textes, documents…) sont, sauf dispositions contraires, la propriété
              intellectuelle exclusive de l’Association pour la transition bas carbone. Par conséquent, toute
              reproduction, représentation, transmission, diffusion, partielle ou totale, est interdite selon les termes
              de l’article L. 122-4 du CPI sous réserve des exceptions prévues à l’article L. 122-5 du CPI. Toute
              utilisation de données figurant sur ce site nécessite une autorisation préalable et expresse. A défaut, le
              délit de contrefaçon constitué est sanctionné sur le fondement des articles L. 335-2 et suivants du CPI.
            </p>
            <p>
              Pour toute exploitation autorisée de tout ou partie du contenu du site, faire figurer le nom de l’auteur,
              ses qualités, l’année de publication et la source.
            </p>
            <div className={styles.section}>Liens hypertextes </div>
            <p>
              L’éditeur ne saurait engager sa responsabilité sur le contenu des informations figurant sur les pages
              auxquelles les liens hypertextes du présent site renvoient.
            </p>
            <div className={styles.section}>Droits d’accès</div>
            <p>
              Conformément au Règlement (UE) 2016/679 relatif à la protection des données à caractère personnel, vous
              disposez sur vos données des droit d’accès, droit de rectification et du droit d’opposition.
            </p>
            <div className={styles.section}>La marque Bilan Carbone®</div>
            <p>
              La marque Bilan Carbone® est une marque déposée en France depuis le 2 décembre 2003, enregistrée sous le
              numéro 3260464.
            </p>
            <p>
              Tous droits de reproduction ou d’utilisation sont réservés s’agissant des représentations iconographiques
              et photographiques de la marque. La reproduction à des fins de diffusion ou d’exploitation de tout ou
              partie de la marque Bilan Carbone® n’est possible qu’avec l’autorisation expresse de l’Association pour la
              transition Bas Carbone. Le cas échéant, aucune modification de forme qui détournerait le sens et l’image
              Bilan Carbone® ne pourra être apportée. Un lien devra être établi vers l’Association pour la transition
              Bas Carbone.
            </p>
          </>
        )}
      </div>
    </Block>
  )
}

export default LegalNotices
