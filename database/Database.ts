import { DynamoDB, AWSError } from 'aws-sdk'
import { File, ServiceType, DatabaseItem } from '../model/Models'
import { DocumentClient, QueryOutput } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
import dotenv from 'dotenv'
import { typeToString } from '../functions/Functions'
import { exportsTableName } from '../utils/Config'

export class Database {
    dynamoDb: DocumentClient
    downloadTable = exportsTableName

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

    saveFiles(files: File[]): Promise<boolean[]> {
        return Promise.all(files.map(file => {
            return this.saveFile(file)
        }))
    }

    saveFile(file: File): Promise<boolean> {
        const { downloadTable, dynamoDb } = this
        return new Promise<boolean>((resolve, reject) => {
            console.info(`Saving: ${file.downloadPath}`)
            dynamoDb.put({
                TableName: downloadTable,
                Item: fileToItem(file),
            }, (error, result) => {
                if (!!error) {
                    reject(error)
                    return
                }
                console.info(`DB Save result: ${JSON.stringify(result)}`)
                resolve(true)
            })
        })
    }

    listDownloads(): Promise<File[]> {
        const { downloadTable, dynamoDb } = this
        return new Promise<File[]>((resolve, reject) => {
            dynamoDb.scan({
                TableName: downloadTable,
                FilterExpression: "downloaded = :downloaded",
                ExpressionAttributeValues: {
                    ":downloaded": "0"
                }
            }, (error: AWSError, data: QueryOutput) => {
                if (!!error) {
                    reject(error)
                    return
                }
                if (!data.Items) {
                    resolve([])
                    return
                }
                const files = data.Items.map((item): File => {
                    return itemToFile(item)
                })
                resolve(files)
            })
        })
    }

    getStatus(path: string): Promise<File[]> {
        const { downloadTable, dynamoDb } = this
        return new Promise<File[]>((resolve, reject) => {
            dynamoDb.scan({
                TableName: downloadTable,
                FilterExpression: "downloadPath = :l",
                ExpressionAttributeValues: {
                    ":l": path
                }
            }, (error: AWSError, data: QueryOutput) => {
                if (!!error) {
                    reject(error)
                    return
                }
                if (!data.Items) {
                    resolve([])
                    return
                }
                const files = data.Items.map(item => {
                    return itemToFile(item)
                })
                resolve(files)
            })
        })
    }

    async downloadCompleted(path: string): Promise<Boolean[]> {
        const files = await this.getStatus(path)
        files.forEach(file => file.downloaded = true)
        return this.saveFiles(files)
    }
}

function itemToFile(item: any): File {
    return {
        downloaded: item.downloaded === '1' ? true : false,
        downloadPath: item.downloadPath as string,
        pathAvailable: true, //TODO: Fix for Tune
        type: ServiceType.Branch //TODO: Fix for Tune
    }
}

function fileToItem(file: File): DatabaseItem {
    return {
        downloaded: `${file.downloaded ? '1' : '0'}`,
        downloadPath: `${file.downloadPath}`,
        pathAvailable: `${file.pathAvailable ? '1' : '0'}`,
        type: typeToString(file.type)
    }
}