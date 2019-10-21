import { APIGatewayProxyHandler, Context, Callback, APIGatewayEvent } from 'aws-lambda'
import 'source-map-support/register'
import * as pathUtil from 'path'
import { Database } from '../database/Database'
import * as zlib from 'zlib'
import * as https from 'https'
import { Response } from '../model/Models'
import { s3 } from '../utils/Config'

const database = new Database()

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

  console.info(`File: ${key} written to bucket: ${destBucket}`)
  try {
    await streamUncompressed(path, bucket, key)
    // await uploadToS3(data, destBucket, key, path)
    await database.downloadCompleted(path)
    const result: Response = {
      statusCode: 200,
      body: path,
      isBase64Encoded: false
    }
    return result
  } catch (error) {
    console.error(`Error downloading and unzipping file on S3: ${JSON.stringify(error)}`)
    const failed: Response = {
      statusCode: 400,
      body: (error.message || 'Unknown error'),
      isBase64Encoded: false
    }
    return failed
  } finally {
    context.done(null, "success");
  }
}

function streamUncompressed(path: string, bucket: string, key: string): Promise<string> {
  return new Promise<any>(async (resolve, reject) => {
    https.get(path, async (response) => {
      console.debug(`Setting up unzip pipeline`)
      console.debug(`Headers: ${JSON.stringify(response.headers)}`)
      const stream = response.pipe(zlib.createGunzip())
      await uploadReadableStream(stream, bucket, key, path)
      resolve()
    }).on('error', error => {
      reject(error)
    })
  })
}

async function uploadReadableStream(stream: NodeJS.ReadableStream, bucket: string, key: string, path: string) {
  const params = {
    Bucket: bucket, 
    Key: key, 
    Body: stream,
    Metadata: { downloadPath: path}
  }
  return s3.upload(params).promise()
}
