import { checkCronRequest } from '@/app/api/cron/utils'
import { assignTrainingStudies } from '@/scripts/formationStudies/assignTrainingStudies'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const error = checkCronRequest(req, 'assign-training-studies')
  if (error) {
    return error
  }

  await assignTrainingStudies()
  return new Response('OK', { status: 200 })
}
