'use server'

import { withServerResponse } from '@/utils/serverResponse'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const accessKey = process.env.SCW_ACCESS_KEY as string
const secretKey = process.env.SCW_SECRET_KEY as string
const bucketName = process.env.SCW_BUCKET_NAME as string
const region = process.env.SCW_REGION

const endpoint = `https://${bucketName}.s3.${region}.scw.cloud`

let s3: S3Client | null = null
const getS3Client = () => {
  if (!s3) {
    s3 = new S3Client({
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      region,
      endpoint,
      forcePathStyle: true,
    })
  }
  return s3
}

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

    const data = await getS3Client().send(new PutObjectCommand(params))
    return { key: bucketFileKey, ETag: data.ETag || '' }
  })

export const deleteFileFromBucket = async (fileKey: string) =>
  withServerResponse('deleteFileFromBucket', async () => {
    return getS3Client().send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey }))
  })

export const getFileUrlFromBucket = async (fileKey: string) =>
  withServerResponse('getFileUrlFromBucket', async () => {
    const client = getS3Client()
    // Check if the file exists, otherwise throw an error
    await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: fileKey }))
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucketName, Key: fileKey }), { expiresIn: 3600 })
  })

export const getFileFromBucket = async (fileKey: string) =>
  withServerResponse('getFileFromBucket', async () => {
    const response = await getS3Client().send(new GetObjectCommand({ Bucket: bucketName, Key: fileKey }))
    if (!response.Body) {
      throw new Error('No file content received')
    }
    return Buffer.from(await response.Body.transformToByteArray())
  })
