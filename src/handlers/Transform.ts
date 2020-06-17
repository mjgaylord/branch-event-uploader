import { Context, Callback, S3CreateEvent } from 'aws-lambda'
import { StringStream } from 'scramjet'
import { Response } from '../model/Models'
import { getStream } from '../utils/s3'
import { lambda } from '../utils/Config'
import BranchEvent from '../model/BranchEvent'
import { parse } from 'papaparse'
import { Database } from '../database/Database'

export const run = async (event: S3CreateEvent, _context: Context, _callback: Callback): Promise<any> => {
  console.info(`New file arrived: ${JSON.stringify(event.Records[0])}`)
  const bucket = event.Records[0].s3.bucket.name
  const filename = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
  try {
    const file = {
      downloadPath: filename
    }
    await new Database().saveFile(file)
    const stream = getStream(bucket, filename)
    console.debug(`Uploading results for: ${bucket}/${filename}`)
    const uploadResults = await transformAndUpload(stream, filename)
    console.debug(`Upload completed`)
    const result: Response = {
      statusCode: 200,
      body: `Upload results: ${JSON.stringify(uploadResults)}`,
      isBase64Encoded: false
    }
    return result
  } catch (error) {
    console.error('Unable to download ' + bucket + '/' + filename + ' and upload events' + ' due to an error: ' + error)
    const failed: Response = {
      statusCode: 400,
      body: error.message || 'Unknown error occurred',
      isBase64Encoded: false
    }
    return failed
  }
}

export async function transformAndUpload(
  stream: NodeJS.ReadableStream,
  filename: string
): Promise<{batchCount: number, eventCount: number}> {
  let counter = 0
  let sequence = 0
  var header: string
  await StringStream.from(stream, { maxParallel: 10 })
    .lines('\n')
    .batch(500)
    .map(async function(chunks: Array<string>) {
      var input = ''
      if (!header) {
        header = chunks[0]
        input = chunks.join('\n')
      } else {
        input = header + '\n' + chunks.join('\n')
      }
      const events = parseEvent(input)
      counter = counter + events.length
      await uploadEvents(events, filename, sequence)
      sequence++
      // const results = await upload(events, filename)
      return []
    })
    .run()
    .catch(e => {
      console.error(`Error uploading events: ${e.stack} counter: ${counter}`)
      throw e
    })
  console.debug(`Total lines processed: ${counter} - Total sequences: ${sequence}`)
  const database = new Database()
  await database.updateFileMetrics(filename, sequence, counter)
  return { batchCount: sequence, eventCount: counter}
}

export async function uploadEvents(events: BranchEvent[], filename: string, sequence: number) {
  const functionName = `${process.env.FUNCTION_PREFIX}-upload`
  try {
    await lambda
      .invoke({
        LogType: 'None',
        FunctionName: functionName,
        Payload: JSON.stringify({ events, filename, sequence }) // pass params
      })
      .promise()
    return { success: true }
  } catch (error) {
    console.error(`Error executing lambda due to: ${error}`)
    return { success: false, error }
  }
}

export function parseEvent(input: string): BranchEvent[] {
  const events: BranchEvent[] = parse(input, {
    delimiter: ',',
    header: true,
    skipEmptyLines: true
  }).data
  return events
}