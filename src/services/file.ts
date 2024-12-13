import { createDocument } from '@/db/document'
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { auth } from './auth'
import { NOT_AUTHORIZED } from './permissions/check'

const accessKey = process.env.SCW_ACCESS_KEY
const secretKey = process.env.SCW_SECRET_KEY
const bucketName = process.env.SCW_BUCKET_NAME as string
const region = process.env.SCW_REGION

const enpoint = `https://${bucketName}.s3.${region}.scw.cloud`

const s3 = new AWS.S3({
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
  endpoint: enpoint,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
})

export const download = (fileContent: string[], filename: string, filetype: string) => {
  const blob = new Blob(fileContent, { type: filetype })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
}

export const uploadFileToBucket = async (file: File, studyId: string): Promise<string> => {
  try {
    const session = await auth()
    const bucketFileKey = uuidv4()

    if (!session || !session.user) {
      return NOT_AUTHORIZED
    }

    const fileContent = await file.arrayBuffer()
    const buffer = Buffer.from(fileContent)

    const params = {
      Bucket: bucketName,
      Key: bucketFileKey,
      Body: buffer,
      ContentType: file.type,
    }

    const result = await s3.upload(params).promise()
    await createDocument({
      name: file.name,
      type: file.type,
      uploader: { connect: { id: session.user.id } },
      study: { connect: { id: studyId } },
      bucketKey: bucketFileKey,
      bucketETag: result.ETag,
    })
    return result.Location
  } catch (error) {
    console.error('Erreur lors de l’upload du fichier:', error)
    throw new Error('Échec de l’upload')
  }
}

export const getFileUrlFromBucket = async (fileName: string): Promise<string> => {
  const params: AWS.S3.GetObjectRequest = {
    Bucket: bucketName,
    Key: fileName,
  }

  try {
    return s3.getSignedUrl('getObject', { ...params, Expires: 3600 })
  } catch (error) {
    console.error('Erreur lors de la récupération de l’URL du fichier :', error)
    throw new Error('Impossible de récupérer le fichier')
  }
}
