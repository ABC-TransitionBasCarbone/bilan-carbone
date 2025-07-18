import { getCNCById } from '@/db/cnc'
import { getOrganizationVersionById } from '@/db/organization'
import { getStudyById } from '@/db/study'
import { dbActualizedAuth } from '@/services/auth'
import { notFound, redirect } from 'next/navigation'
import PDFPreviewContent from './PDFPreviewContent'

interface Props {
  params: Promise<{ studyId: string }>
  searchParams: Promise<{ print?: string }>
}

export default async function PDFPreviewPage({ params, searchParams }: Props) {
  const { studyId } = await params
  const { print } = await searchParams

  // Vérifier que c'est bien pour l'impression (sécurité)
  if (!print) {
    redirect('/dashboard')
  }

  const session = await dbActualizedAuth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const study = await getStudyById(studyId, session.user.organizationVersionId)
  if (!study) {
    notFound()
  }

  const organization = await getOrganizationVersionById(study.organizationVersionId)
  if (!organization) {
    notFound()
  }

  // Pré-charger les données CNC pour tous les sites
  const cncDataPromises = study.sites.map(async (studySite) => {
    const orgSite = organization.organization.sites.find((site) => site.id === studySite.site.id)
    if (orgSite?.cncId) {
      try {
        const cncData = await getCNCById(orgSite.cncId)
        return {
          siteId: studySite.site.id,
          data: cncData
            ? {
                nom: cncData.nom || undefined,
                commune: cncData.commune || undefined,
                ecrans: cncData.ecrans || undefined,
              }
            : null,
        }
      } catch (error) {
        console.error('Error fetching CNC data:', error)
        return { siteId: studySite.site.id, data: null }
      }
    }
    return { siteId: studySite.site.id, data: null }
  })

  const cncDataResults = await Promise.all(cncDataPromises)
  const cncDataMap = new Map(cncDataResults.map((result) => [result.siteId, result.data]))

  return <PDFPreviewContent study={study} organization={organization} cncDataMap={cncDataMap} />
}
