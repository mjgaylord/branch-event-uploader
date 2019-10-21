import { APIGatewayProxyHandler, Context, Callback } from 'aws-lambda'
import 'source-map-support/register'
// @ts-ignore
import dotenv from 'dotenv'
import { Response } from '../model/Models'
import { Database } from '../database/Database'

const database = new Database()

export const run: APIGatewayProxyHandler = async (event: any = {}, _context: Context, _callback: Callback): Promise<any> => {
  dotenv.config()
  try {

    //@ts-ignore
    const { location } = event.queryStringParameters
    if (!location) {
      throw new Error('`location` parameter missing from query string')
    }
    const files = await database.listFilesByDownloadPath(location)
    const result: Response = {
      statusCode: 200,
      body: JSON.stringify(files),
      isBase64Encoded: false
    }
    return result
  } catch (error) {
    console.error("Check status failed", error)
    const failed: Response = {
      statusCode: 400,
      body: (error.message || 'Unknown error'),
      isBase64Encoded: false
    }
    return failed
  }
}