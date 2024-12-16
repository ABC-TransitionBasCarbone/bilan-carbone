import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { fileTypeFromBlob } from 'file-type'
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

export const download = (fileContent: string[], fileName: string, fileType: string) => {
  const blob = new Blob(fileContent, { type: fileType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
}

export const downloadFromUrl = async (url: string, fileName: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    return response.statusText
  }

  const fileBlob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(fileBlob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}

export const allowedFlowFileTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

export const isAllowedFileType = async (file: File, allowedTypes: string[]) => {
  const fileType = (await fileTypeFromBlob(file))?.mime
  return fileType && allowedTypes.includes(fileType)
}

export const uploadFileToBucket = async (file: File) => {
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
}

export const deleteFileFromBucket = async (fileKey: string) => {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
  }
  return s3.send(new DeleteObjectCommand(params))
}

export const getFileUrlFromBucket = async (fileKey: string) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}
