import { Context, Callback, S3CreateEvent } from 'aws-lambda'
import { Response, UploadResult, ExportService } from '../model/Models'
import { parse } from 'papaparse'
import BranchEvent from '../model/BranchEvent'
import { getFile } from '../utils/s3'
import { configuredServices, lambda } from '../utils/Config'
import { uploadToSegment } from '../event-uploaders/SegmentUploader'
import { uploadToAmplitude } from '../event-uploaders/AmplitudeUploader'
import { uploadToMixpanel } from '../event-uploaders/MixpanelUploader'

export const run = async (event: S3CreateEvent, _context: Context, _callback: Callback): Promise<any> => {
  console.info(`New file arrived: ${JSON.stringify(event.Records[0])}`)
  const bucket = event.Records[0].s3.bucket.name
  const filename = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "))
  try {
    const file = await getFile(bucket, filename)
    console.debug(`Uploading results for: ${bucket}/${filename}`)
    const uploadResults = await transformAndUpload(file, filename)
    console.debug(`Upload completed.`)

    const reported = await sendJobReport(uploadResults)
    if (!!reported.error) {
      const result: Response = {
        statusCode: 500,
        body: `Unable to notify report lambda due to: ${reported.error}`,
        isBase64Encoded: false
      }
      return result
    }
    const result: Response = {
      statusCode: 200,
      body: `Upload results: ${JSON.stringify(uploadResults)}`,
      isBase64Encoded: false
    }
    return result
  } catch (error) {
    console.error(
      'Unable to download ' + bucket + '/' + filename +
      ' and upload events' +
      ' due to an error: ' + error
    )
    const failed: Response = {
      statusCode: 400,
      body: error.message || "Unknown error occurred",
      isBase64Encoded: false
    }
    return failed
  }
}

export async function transformAndUpload(file: string, filename: string): Promise<Array<UploadResult>> {
  const events = transformCSVtoJSON(file)
  let uploadResults = Array<UploadResult>()
  const services = configuredServices()
  if (events.length === 0) {
    console.warn(`Events empty, nothing to upload.`)
    return uploadResults
  }
  console.info(`CSV converted to JSON uploading ${events.length} events to: ${services.join(', ')}`)
  return await Promise.all(services.map(async service => {
    console.debug(`Uploading to ${service}...`)
    switch (service) {
      case ExportService.Segment:
        return await uploadToSegment(events, filename)
      case ExportService.Amplitude:
        return await uploadToAmplitude(events, filename)
      case ExportService.Mixpanel:
        return await uploadToMixpanel(events, filename)
    }
  }))
}

function transformCSVtoJSON(csv: string): BranchEvent[] {
  console.debug(`Transforming JSON`)
  const result = parse(csv.trim(), {
    delimiter: ',',
    header: true
  })
  const { errors } = result
  if (!!errors && errors.length > 0) {
    console.warn(`Errors parsing data: ${JSON.stringify(errors)}`)
    throw new Error(JSON.stringify(errors))
  }
  return result.data
}

async function sendJobReport(results: Array<UploadResult>) {
  const functionName = `${process.env.FUNCTION_PREFIX}-report`
  try {
    await lambda.invoke({
      LogType: 'Tail',
      FunctionName: functionName,
      Payload: JSON.stringify({ results }) // pass params
    }).promise()
    return { success: true }
  } catch (error) {
    console.error(`Error executing lambda due to: ${error}`)
    return { success: false, error }
  }
}