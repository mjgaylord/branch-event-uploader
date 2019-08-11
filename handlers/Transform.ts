//@ts-ignore
import Analytics from 'analytics-node'
import { Context, Callback, S3CreateEvent } from 'aws-lambda'
import { Response, FailedEvent, UploadResult } from '../model/Models'
import { parse } from 'papaparse'
import BranchEvent from '../model/BranchEvent'
import { SegmentTransformer } from '../transformers/Transformer'
import { getFile, loadTemplates } from '../utils/s3'
import { templatesBucket } from '../config/Config'

const analytics = new Analytics(process.env.SEGMENT_WRITE_KEY);

export const run = async (event: S3CreateEvent, _context: Context, _callback: Callback): Promise<any> => {
  console.info(`New file arrived: ${JSON.stringify(event.Records[0])}`)
  const bucket = event.Records[0].s3.bucket.name
  const filename = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "))

  try {
    const file = await getFile(bucket, filename)
    console.debug(`Uploading results for: ${bucket}/${filename}`)
    const template = await getFile(templatesBucket, 'SEGMENT.mst')
    const partials = await loadTemplates(templatesBucket, 'partials')
    const uploadResult = await transformAndUpload(file, template, partials)
    if ((uploadResult.errors.length) > 0) {
      const failed: Response = {
        statusCode: 400,
        body: `There were errors uploading ${filename} the events to Segment.\nTotal events: ${uploadResult.totalEvents}\nError count: ${uploadResult.errors.length}`,
        isBase64Encoded: false
      }
      return failed
    }
    console.info(
      'Successfully downloaded ' + bucket + '/' + filename +
      ' and uploaded to Segment!'
    )
    const result: Response = {
      statusCode: 200,
      body: `Upload of file: ${filename} successful\nTotal events: ${uploadResult.totalEvents}`,
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

export async function transformAndUpload(file: string, template: string, partials: {}): Promise<UploadResult> {
  const events = await transformCSVtoJSON(file)
  console.debug(`CSV converted to JSON, uploading to Segment...`)
  const errors = await uploadToSegment(events, template, partials)
  return { totalEvents: events.length, errors, file }
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

async function uploadToSegment(events: BranchEvent[], template, partials): Promise<Array<FailedEvent>> {
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
      errors.push({event, reason: JSON.stringify(error)})
    }
  }
  await completed()
  return errors
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