import { DynamoDB } from 'aws-sdk'
import {
  File,
  ServiceType,
  DownloadDatabaseItem,
  BatchUploadDatabaseItem,
  BatchUpload,
  UploadResultStatus,
  reducedStatus,
  ExportRequest,
  ExportRequestDatabaseItem,
  ExportRequestStatus
} from '../model/Models'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
// @ts-ignore
import dotenv from 'dotenv'
import { typeToString, exportRequestStatusToString, exportRequestStatusFromValue } from '../functions/Functions'
import { batchUploadTableName, exportsTableName, exportRequestStatusTableName } from '../utils/Config'
import { compressString, decompressString } from '../utils/Compression'
import * as moment from 'moment'

export class Database {
  dynamoDb: DocumentClient
  downloadTable = exportsTableName
  batchUploadTable = batchUploadTableName
  exportRequestStatusTable = exportRequestStatusTableName

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
    const { downloadTable, dynamoDb } = this
    const result = await dynamoDb
      .put({
        TableName: downloadTable,
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
    const { downloadTable, dynamoDb } = this
    const data = await dynamoDb
      .scan({
        TableName: downloadTable,
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

  async downloadCompleted(path: string): Promise<void[]> {
    const files = await this.listFilesByDownloadPath(path)
    files.forEach(file => (file.downloaded = true))
    return this.saveFiles(files)
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
    const { downloadTable, dynamoDb } = this
    const data = await dynamoDb.scan(
        {
          TableName: downloadTable,
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

  async saveExportRequest(request: ExportRequest): Promise<void> {
    const { exportRequestStatusTable, dynamoDb } = this
    const item = exportRequestToItem(request)
    const result = await dynamoDb
      .put({
        TableName: exportRequestStatusTable,
        Item: item
      })
      .promise()
    console.info(`DB Save result: ${JSON.stringify(result)}`)
  }

  async listUnsuccessfulExportRequests(): Promise<ExportRequest[]> {
    const { exportRequestStatusTable, dynamoDb } = this
    var param = {
      TableName: exportRequestStatusTable,
      FilterExpression: "#request_status = :failed OR #request_status = :empty",
      ExpressionAttributeValues: {
        ":failed": exportRequestStatusToString(ExportRequestStatus.Failed),
        ":empty": exportRequestStatusToString(ExportRequestStatus.Empty),
      },
      ExpressionAttributeNames: {
        "#request_status": "status"
      }
    };
    const data = await dynamoDb
      .scan(param)
      .promise()
    if (!data.Items) {
      return []
    }
    return Promise.all(
      data.Items.map(item => {
        return itemToExportRequest(item)
      })
    )
  }
}

export function itemToFile(item: any): File {  
  return {
    downloaded: item.downloaded === '1' ? true : false,
    downloadPath: item.downloadPath as string,
    pathAvailable: true, //TODO: Fix for Tune
    type: ServiceType.Branch, //TODO: Fix for Tune,
    batchCount: Number.isInteger(item.batchCount) ? parseInt(item.batchCount) : undefined,
    eventCount: Number.isInteger(item.eventCount) ? parseInt(item.eventCount) : undefined
  }
}

export function fileToItem(file: File): DownloadDatabaseItem {
  return {
    downloaded: `${file.downloaded ? '1' : '0'}`,
    downloadPath: `${file.downloadPath}`,
    pathAvailable: `${file.pathAvailable ? '1' : '0'}`,
    type: typeToString(file.type),
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

export function exportRequestToItem(request: ExportRequest): ExportRequestDatabaseItem {
  const { dateRequested, status } = request
  const dateString = moment(dateRequested).format('YYYY-MM-DD')
  return {
    dateRequested: dateString,
    status: exportRequestStatusToString(status)
  }
}

export function itemToExportRequest(item: any): ExportRequest {
  const { dateRequested, status } = item
  return {
    dateRequested: moment(dateRequested, 'YYYY-MM-DD').toDate(),
    status: exportRequestStatusFromValue(status)
  }
}

