import { DynamoDB } from 'aws-sdk'
import {
  BatchUploadDatabaseItem,
  BatchUpload,
  UploadResultStatus,
  DownloadDatabaseItem,
  reducedStatus,
  File
} from '../model/Models'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
// @ts-ignore
import dotenv from 'dotenv'
import { batchUploadTableName, filesTable } from '../utils/Config'
import { compressString, decompressString } from '../utils/Compression'

export class Database {
  dynamoDb: DocumentClient
  batchUploadTable = batchUploadTableName

  constructor() {
    AWS.config.update({ region: process.env.REGION })
    dotenv.config()
    // if we're running offline we need to specify the endpoint as localhost
    const endpoint = process.env.OFFLINE ? { endpoint: 'http://localhost:8000' } : {}
    this.dynamoDb = new DynamoDB.DocumentClient({
      region: process.env.REGION,
      ...endpoint
    })
  }

  saveFiles(files: File[]): Promise<void[]> {
    console.info(`Saving ${files.length} to database`)
    return Promise.all(
      files.map(file => {
        return this.saveFile(file)
      })
    )
  }

  async saveFile(file: File): Promise<void> {
    const { dynamoDb } = this
    const result = await dynamoDb
      .put({
        TableName: filesTable,
        Item: fileToItem(file)
      })
      .promise()
    console.info(`DB Save result: ${JSON.stringify(result)} for file: ${JSON.stringify(file)}`)
  }

  async updateFileMetrics(filename: string, batchCount: number, eventCount: number): Promise<void[]> {
      const files = await this.listFilesByFilename(filename)
      const updated = files.map(file => {
        return appendMetrics(file, batchCount, eventCount)
      })
      return this.saveFiles(updated)
  }

  async saveBatchUpload(upload: BatchUpload): Promise<void> {
    const { batchUploadTable, dynamoDb } = this
    const item = await batchUploadToItem(upload)
    const result = await dynamoDb
      .put({
        TableName: batchUploadTable,
        Item: item
      })
      .promise()
    console.info(`DB Save result: ${JSON.stringify(result)}`)
  }

  async listBatchUploadsByStatus(status: UploadResultStatus): Promise<BatchUpload[]> {
    return this.listBatchUploads('status = :s', status)
  }

  async listDownloads(): Promise<File[]> {
    const { dynamoDb } = this
    const data = await dynamoDb
      .scan({
        TableName: filesTable,
        FilterExpression: 'downloaded = :l',
        ExpressionAttributeValues: {
          ':l': '0'
        }
      })
      .promise()
    if (!data.Items) {
      return []
    }
    return data.Items.map(
      (item): File => {
        return itemToFile(item)
      }
    )
  }

  async uploadStatus(filename: string): Promise<{file: File, status: UploadResultStatus}> {
    const uploads = await this.listBatchUploads('filename = :s', filename)
    const status = reducedStatus(uploads.map(f => f.status))
    const files = await this.listFilesByFilename(filename)
    console.debug(`Files listed: ${JSON.stringify(files)}`)
    if (files.length === 0) {
      throw new Error(`Download with filename: ${filename} does not exist.`)
    }
    return {file: files[0], status}
  }

  async listFilesByDownloadPath(path: string): Promise<File[]> {
    return this.listFilesByFilterExpression('downloadPath = :l', path)
  }

  private async listFilesByFilename(filename: string): Promise<File[]> {
    return this.listFilesByFilterExpression('contains(downloadPath, :l)', filename)
  }

  private async listFilesByFilterExpression(expression: string, param: string): Promise<File[]> {
    const { dynamoDb } = this
    const data = await dynamoDb.scan(
        {
          TableName: filesTable,
          FilterExpression: expression,
          ExpressionAttributeValues: {
            ':l': param
          }
        }
    ).promise()
    if (!data.Items) {
        return []
    }
    return data.Items.map(item => {
        return itemToFile(item)
      })
  }

  private async listBatchUploads(expression: string, value: string | number): Promise<BatchUpload[]> {
    const { batchUploadTable, dynamoDb } = this
    const data = await dynamoDb
      .scan({
        TableName: batchUploadTable,
        FilterExpression: expression,
        ExpressionAttributeValues: {
          ':s': `${value}`
        }
      })
      .promise()
    if (!data.Items) {
      return []
    }
    return Promise.all(
      data.Items.map(item => {
        return itemToBatchUpload(item)
      })
    )
  }
}

export function itemToFile(item: any): File {  
  return {
    downloadPath: item.downloadPath as string,
    batchCount: Number.isInteger(item.batchCount) ? parseInt(item.batchCount) : undefined,
    eventCount: Number.isInteger(item.eventCount) ? parseInt(item.eventCount) : undefined
  }
}

export function fileToItem(file: File): DownloadDatabaseItem {
  return {
    downloadPath: `${file.downloadPath}`,
    batchCount: `${file.batchCount}`,
    eventCount: `${file.eventCount}`
  }
}

export async function batchUploadToItem(upload: BatchUpload): Promise<BatchUploadDatabaseItem> {
  const { filename, sequence, status, events, errors } = upload
  const identifier = `${filename}->${sequence}`
  const compressedEvents = await compressString(!!events ? JSON.stringify(events) : undefined)
  const compressedErrors = await compressString(!!errors ? JSON.stringify(errors) : undefined)
  return {
    status: `${status}`,
    compressedEvents,
    compressedErrors,
    identifier
  }
}

export async function itemToBatchUpload(item: any): Promise<BatchUpload> {
  const { identifier, compressedEvents, compressedErrors, status } = item
  const components = identifier.split('->')
  const filename = components[0]
  const sequence = parseInt(components[1], 10)
  const eventsString = await decompressString(compressedEvents)
  const errorsString = await decompressString(compressedErrors)
  const events = !!eventsString ? JSON.parse(eventsString) : []
  const errors = !!errorsString ? JSON.parse(errorsString) : []
  return {
    status: parseInt(status),
    filename,
    sequence,
    events,
    errors
  }
}

export function appendMetrics(file: File, batchCount: number, eventCount: number): File {
  return {...file, batchCount, eventCount}
}
