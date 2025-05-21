'use server'

import { withServerResponse } from '@/utils/serverResponse'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const accessKey = process.env.SCW_ACCESS_KEY as string
const secretKey = process.env.SCW_SECRET_KEY as string
const bucketName = process.env.SCW_BUCKET_NAME as string
const region = process.env.SCW_REGION

const endpoint = `https://${bucketName}.s3.${region}.scw.cloud`

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region,
  endpoint,
  forcePathStyle: true,
})

export const uploadFileToBucket = async (file: File) =>
  withServerResponse('uploadFileToBucket', async () => {
    const bucketFileKey = uuidv4()
    const fileContent = await file.arrayBuffer()
    const buffer = Buffer.from(fileContent)

    const params = {
      Bucket: bucketName,
      Key: bucketFileKey,
      Body: buffer,
      ContentType: file.type,
    }

    const data = await s3.send(new PutObjectCommand(params))
    return { key: bucketFileKey, ETag: data.ETag || '' }
  })

export const deleteFileFromBucket = async (fileKey: string) =>
  withServerResponse('deleteFileFromBucket', async () => {
    return s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey }))
  })

export const getFileUrlFromBucket = async (fileKey: string) =>
  withServerResponse('getFileUrlFromBucket', async () => {
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucketName, Key: fileKey }), { expiresIn: 3600 })
  })
