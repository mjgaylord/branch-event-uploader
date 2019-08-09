//@ts-ignore
import { Converter } from 'csvtojson'

//@ts-ignore
import Analytics from 'analytics-node'
import { Context, Callback, S3CreateEvent } from 'aws-lambda'
import { Response } from '../model/Models';


export const run = async (_event: S3CreateEvent, _context: Context, _callback: Callback): Promise<any> => {
  console.info(`New file arrived: ${JSON.stringify(_event.Records[0])}`)
  const result: Response = {
    statusCode: 200,
    body: "Transform successful",
    isBase64Encoded: false
  }
  return result
}