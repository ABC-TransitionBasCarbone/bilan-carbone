import AWS from 'aws-sdk'
import { fileTypeFromBlob } from 'file-type'
import { v4 as uuidv4 } from 'uuid'

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

export const uploadFileToBucket = async (file: File): Promise<AWS.S3.ManagedUpload.SendData> => {
  const bucketFileKey = uuidv4()

  const fileContent = await file.arrayBuffer()
  const buffer = Buffer.from(fileContent)

  const params = {
    Bucket: bucketName,
    Key: bucketFileKey,
    Body: buffer,
    ContentType: file.type,
  }

  return s3.upload(params).promise()
}

export const deleteFileFromBucket = async (fileKey: string) => {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
  }
  return s3.deleteObject(params).promise()
}

export const getFileUrlFromBucket = async (fileKey: string) =>
  s3.getSignedUrl('getObject', { Bucket: bucketName, Key: fileKey, Expires: 3600 })
