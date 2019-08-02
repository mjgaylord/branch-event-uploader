import { APIGatewayProxyHandler, Context, Callback, APIGatewayEvent } from 'aws-lambda'
import 'source-map-support/register'
import fetch from 'node-fetch'
import * as pathUtil from 'path'
import { s3 } from './config/Config'
// import { Database } from './database/Database'

// const database = new Database()

export const run: APIGatewayProxyHandler = async (event: APIGatewayEvent, context: Context, _callback: Callback) => {
    
  //@ts-ignore
  const { path, bucket } = event
  
  console.log(`path to file: ${path}`)
  if (!path) {
    throw new Error('path value missing from request body...')
  }

  const parsed = pathUtil.parse(path)
  const key = parsed.name
  const destBucket = bucket
  context.callbackWaitsForEmptyEventLoop = true

  function downloadAsync() {
    return new Promise<any>(async (resolve, reject) => {
      const response = await fetch(path)
      console.log(`Downloading file: ${path}`)
      if (!response.ok) {
        const result = {
          statusCode: 404,
          body: `Unable to locate: ${path}`
        }
        reject(result)
        return
      }

      console.log('Downloaded file successfully, writing to S3...')
      const buffer = await response.buffer()
      s3.upload({
          Bucket: destBucket,
          Key: key,
          Body: buffer,
          Metadata: { downloadPath: path }
      }, async function(err, _data) {
        if (err) {
          console.error(`Error uploading: ${err}`)
          reject(err)
          throw err
        }
        console.info(`File: ${key} written to bucket: ${destBucket}`)

        //update dynamoDb
        // await database.downloadCompleted(path)

        resolve("working")
       })
    })
  }

  await downloadAsync()
  context.done(null, "success");

  return {
    statusCode: 200,
    body: JSON.stringify({
      input: event.queryStringParameters,
    })
  }
}