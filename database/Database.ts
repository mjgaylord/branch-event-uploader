import { DynamoDB } from 'aws-sdk'
import { File } from '../model/Models'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'

export class Database {
    dynamoDb: DocumentClient
    
    constructor() {
        AWS.config.update({region: 'us-east-1'})
        this.dynamoDb = new DynamoDB.DocumentClient({
            region: 'us-east-1', 
            endpoint: 'http://localhost:8000'
        })
    }

    saveFiles(files: File[]): Promise<boolean> {
        return new Promise<boolean>((resolve, reject ) => {
            files.forEach(file => {
                const tableName = process.env.DYNAMODB_TABLE
                const item = {
                    'downloaded': `${file.downloaded ? '1' : '0'}`,
                    'location': `${file.location}`
                }
                this.dynamoDb.put({
                    TableName: tableName,
                    Item: item,
                }, (error, result) => {
                    if (!!error) {
                        reject(error)
                        return
                    }
                    console.debug(`DB Save result: ${JSON.stringify(result)}`)
                    resolve(true)
                })
            })
        })
    }

    // listDownloads(): Promise<File[]> {
    //     return new Promise<File[]>((resolve, reject) => {
    //         this.dynamoDb.scan({}, () => {

    //         })
    //     })
    // }
}