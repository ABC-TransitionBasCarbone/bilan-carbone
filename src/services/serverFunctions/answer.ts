import { deleteAnswerKeysByRow } from '@/db/answer'
import { withServerResponse } from '@/utils/serverResponse'
import { dbActualizedAuth } from '../auth'

export const deleteAnswerKeysFromRow = async (idIntern: string, indexToDelete: string) =>
  withServerResponse('deleteAnswerKeysByRow', async () => {
    console.log('test')
    const session = await dbActualizedAuth()
    console.debug({ session })
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return deleteAnswerKeysByRow(idIntern, indexToDelete)
  })
