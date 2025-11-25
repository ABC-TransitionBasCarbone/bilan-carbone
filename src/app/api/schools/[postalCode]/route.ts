import axios from 'axios'
import { NextRequest } from 'next/server'

const schoolApi = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ postalCode: string }> }) {
  const { postalCode } = await params

  const query = {
    select: 'nom_etablissement,adresse_1,code_postal,identifiant_de_l_etablissement,date_ouverture',
    where: `code_postal="${postalCode}" AND (libelle_nature="COLLEGE" OR libelle_nature="LYCEE" OR libelle_nature="ECOLE DE NIVEAU ELEMENTAIRE")`,
    limit: 99,
  }

  try {
    const { data } = await axios.get(schoolApi, { params: query })
    return Response.json(data.results)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'API Éducation Nationale indisponible' }, { status: 500 })
  }
}
