//@ts-ignore
import Analytics from 'analytics-node'
import { Context, Callback, S3CreateEvent } from 'aws-lambda'
import { Response, FailedEvent, UploadResult, UploadResultStatus, ExportService } from '../model/Models'
import { parse } from 'papaparse'
import BranchEvent from '../model/BranchEvent'
import { getFile, loadTemplates } from '../utils/s3'
import { templatesBucket, configuredServices, excludedTopics, lambda } from '../config/Config'
import { SegmentTransformer } from '../transformers/SegmentTransformer';

const analytics = new Analytics(process.env.SEGMENT_WRITE_KEY);

export const run = async (event: S3CreateEvent, _context: Context, _callback: Callback): Promise<any> => {
  console.info(`New file arrived: ${JSON.stringify(event.Records[0])}`)
  const bucket = event.Records[0].s3.bucket.name
  const filename = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "))

  if (!shouldUpload(filename)) {
    const message = `File - ${filename} marked as excluded, skipping...`
    console.info(message)
    return {
      statusCode: 200,
      body: message,
      isBase64Encoded: false
    }
  }
  try {
    const file = await getFile(bucket, filename)
    console.debug(`Uploading results for: ${bucket}/${filename}`)
    const uploadResults = await transformAndUpload(file, filename)
    console.debug(`Upload completed - results: ${JSON.stringify(uploadResults)}`)

    //TODO: Send JobReport
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
      ' and upload to Segment' +
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

export function shouldUpload(filename: string): Boolean {
  const topics = excludedTopics()
  for (const topic in topics.values) {
    if (filename.indexOf(topic) >= 0) {
      return false
    }
  }
  return true
}

export async function transformAndUpload(file: string, filename: string): Promise<Array<UploadResult>> {
  const events = await transformCSVtoJSON(file)
  let uploadResults = Array<UploadResult>()
  const services = configuredServices()
  if (events.length === 0) {
    console.warn(`Events empty, nothing to upload.`)
    return uploadResults
  }
  console.info(`CSV converted to JSON uploading ${events.length} events to: ${services.join(', ')}`)
  return Promise.all(services.map(async service => {
    console.debug(`Uploading to ${service}...`)
    switch (service) {
      case ExportService.Segment:
        return await uploadToSegment(events, filename)
      case ExportService.Amplitude:
        throw new Error(`Service not yet implemented: ${service}`) 
      case ExportService.Mixpanel:
        throw new Error(`Service not yet implemented: ${service}`)
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

async function uploadToSegment(events: BranchEvent[], filename: string): Promise<UploadResult> {
  const template = await getFile(templatesBucket, 'segment/SEGMENT.mst')
  const partials = await loadTemplates(templatesBucket, 'segment/partials')
  const transformer = new SegmentTransformer(template, partials)
  let errors = new Array<FailedEvent>()
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    // More in the docs here: https://segment.com/docs/spec/track/
    try {
      const segmentEvent = transformer.transform(event)
      if (!segmentEvent) {
        throw new Error(`Transform failed for event`)
      }
      analytics.track(segmentEvent)
    } catch (error) {
      errors.push({ event, reason: JSON.stringify(error) })
    }
  }
  await completed()

  let status = UploadResultStatus.Successful
  if (errors.length === events.length) {
    status = UploadResultStatus.Failed
  } else if (errors.length > 0) {
    status = UploadResultStatus.ContainsErrors
  }
  return {
    totalEvents: events.length,
    service: ExportService.Segment,
    dateOfFile: dateInFilename(filename),
    file: filename,
    errors,
    status
  }
}

const completed = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    analytics.flush((err, batch) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(batch)
    })
  })
}

function dateInFilename(filename: string): string {
  const matches = filename.match('[0-9]{4}[-|\/]{1}[0-9]{2}[-|\/]{1}[0-9]{2}')
  if (matches.length === 0) {
    return "Unknown"
  }
  return matches[0]
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