import { APIGatewayProxyHandler, Context, Callback, APIGatewayEvent } from 'aws-lambda'
import 'source-map-support/register'
import * as pathUtil from 'path'
import { s3 } from '../config/Config'
import { Database } from '../database/Database'
import * as zlib from 'zlib'
import * as https from 'https'
import { Response } from '../model/Models'


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
    const data = await getUncompressed(path)
    await uploadToS3(data, destBucket, key, path)
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

function getUncompressed(path: string): Promise<string> {
  return new Promise<any>(async (resolve, reject) => {
    https.get(path, response => {
      const unzip = zlib.createGunzip()
      const buffer = []
      unzip.on('data', data => {
        buffer.push(data.toString())
      }).on('end', () => {
        const uncompressed = buffer.join("")
        console.log('Downloaded file successfully, writing to S3...')
        resolve(uncompressed)
      })
      response.pipe(unzip)
    }).on('error', error => {
      reject(error)
    })
  })
}

function uploadToS3(csv: string, bucket: string, key: string, path: string): Promise<boolean> {
  return new Promise<any>((resolve, reject) => {
    s3.upload({
      Bucket: bucket,
      Key: key,
      Body: csv,
      Metadata: { downloadPath: path }
    }, async function (err, _data) {
      if (!!err) {
        console.error(`Error uploading: ${err}`)
        reject(err)
        throw err
      }
      resolve(true)
    })
  })
}