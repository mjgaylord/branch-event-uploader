import { Context, Callback, APIGatewayProxyHandler, APIGatewayEvent } from 'aws-lambda'
import { Response, UploadResult, ExportService, UploadResultStatus, FailedEvent } from '../model/Models'
import BranchEvent from '../model/BranchEvent'
import { configuredServices, lambda, includeOrganic } from '../utils/Config'
import { uploadToSegment } from '../event-uploaders/SegmentUploader'
import { uploadToAmplitude } from '../event-uploaders/AmplitudeUploader'
import { uploadToMixpanel } from '../event-uploaders/MixpanelUploader'
import { Database } from '../database/Database'
import { dateInFilename } from '../utils/StringUtils'
import { isOrganic } from '../model/BranchEvent'

const database = new Database()

export const run: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context, _callback: Callback) => {
  // @ts-ignore
  const { events, filename, sequence } = event
  try {
    if (!events || events.length === 0) {
      throw new Error('Events is empty or undefined, unable to upload')
    }
    console.debug(`Uploading ${events.length} events for: ${filename}`)
    await database.saveBatchUpload({
      status: UploadResultStatus.NotUploaded,
      events,
      filename,
      sequence,
    })
    const errors = await upload(events, filename)
    console.debug(`Upload completed.`)
    const status = statusFromErrors(errors, events.length)
    await database.saveBatchUpload({
      filename,
      sequence,
      status,
      errors
    })
    const jobStatus = await database.uploadStatus(filename)
    console.debug(`Job status: ${JSON.stringify(jobStatus)}`)
    // send the job email if the job is now considered complete
    if (jobStatus.status !== UploadResultStatus.NotUploaded 
      && jobStatus.file.batchCount - 1 === sequence) {
      await sendJobReport({
        totalBatches: jobStatus.file.batchCount || 0,
        totalEvents: jobStatus.file.eventCount || 0,
        file: filename,
        dateOfFile: dateInFilename(filename),
        status: jobStatus.status
      })
    }
    const message = `Upload results: ${status} batch ${sequence} of ${jobStatus.file.batchCount}`
    console.info(message)
    const result: Response = {
      statusCode: 200,
      body: message,
      isBase64Encoded: false
    }
    return result
  } catch (error) {
    console.error('Unable to upload events for ' + filename + ' due to an error: ' + error)
    const failed: Response = {
      statusCode: 400,
      body: error.message || 'Unknown error occurred',
      isBase64Encoded: false
    }
    return failed
  }
}

export async function upload(events: BranchEvent[], filename: string): Promise<FailedEvent[]> {
  const services = configuredServices()
  if (events.length === 0) {
    console.warn(`Events empty, nothing to upload.`)
    return []
  }
  // filter out organic events if necessary
  const filteredEvents = events.filter(event => !includeOrganic() && !isOrganic(event))
  console.info(`Excluding organic events: ${!includeOrganic()}`)
  console.info(`Total events to upload: ${filteredEvents.length}`)
  if (filteredEvents.length === 0) {
    console.info(`Total events to upload empty, skipping...`)
    return []
  }
  console.info(`Uploading ${filteredEvents.length} events to: ${services.join(', ')}`)
  const errors = await Promise.all(
    services.map(async service => {
      console.debug(`Uploading to ${service}...`)
      switch (service) {
        case ExportService.Segment:
          return await uploadToSegment(filteredEvents, filename)
        case ExportService.Amplitude:
          return await uploadToAmplitude(filteredEvents, filename)
        case ExportService.Mixpanel:
          return await uploadToMixpanel(filteredEvents, filename)
      }
    })
  )
  return [].concat(...errors)
}

async function sendJobReport(result: UploadResult) {
  const functionName = `${process.env.FUNCTION_PREFIX}-report`
  try {
    await lambda
      .invoke({
        LogType: 'Tail',
        FunctionName: functionName,
        Payload: JSON.stringify({ result }) // pass params
      })
      .promise()
    return { success: true }
  } catch (error) {
    console.error(`Error executing lambda due to: ${error}`)
    return { success: false, error }
  }
}

function statusFromErrors(errors: FailedEvent[], eventCount: number): UploadResultStatus {
  const { length } = errors
  if (length === 0) {
    return UploadResultStatus.Successful
  }
  if (length === eventCount) {
    return UploadResultStatus.Failed
  }
  return UploadResultStatus.ContainsErrors
}
