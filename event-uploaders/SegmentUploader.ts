//@ts-ignore
import Analytics from 'analytics-node'
import BranchEvent from '../model/BranchEvent'
import { UploadResult, FailedEvent, UploadResultStatus, ExportService } from '../model/Models'
import { getFile, loadTemplates } from '../utils/s3'
import { SegmentTransformer } from '../transformers/SegmentTransformer'
import { templatesBucket } from '../utils/Config'
import { dateInFilename } from '../utils/StringUtils'
import { getSecret, Secret } from '../utils/Secrets'
import { shouldUpload } from './UploaderFunctions'

export async function uploadToSegment(events: BranchEvent[], filename: string): Promise<UploadResult | undefined> {
  try {
    const excludedConfig = process.env.SEGMENT_EXCLUDED_TOPICS
    if (!shouldUpload(filename, excludedConfig)) {
      const message = `File - ${filename} marked as excluded, skipping...`
      console.info(message)
      return
    }
    return upload(events, filename)
  } catch (error) {
    return {
      service: ExportService.Segment,
      errors: [error],
      totalEvents: events.length,
      file: filename,
      dateOfFile: dateInFilename(filename),
      status: UploadResultStatus.Failed
    }
  }

  async function upload(events: BranchEvent[], filename: string): Promise<UploadResult> {
    const template = await getFile(templatesBucket, 'segment/SEGMENT.mst')
    const partials = await loadTemplates(templatesBucket, 'segment/partials')
    const transformer = new SegmentTransformer(template, partials)
    let errors = new Array<FailedEvent>()
    const segmentWriteKey = await getSecret(Secret.SegmentWriteKey)
    const analytics = new Analytics(segmentWriteKey)
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
    let status = UploadResultStatus.Successful
    if (errors.length === events.length) {
      status = UploadResultStatus.Failed
    } else if (errors.length > 0) {
      status = UploadResultStatus.ContainsErrors
    }
    try {
      await completed(analytics)
    } catch (error) {
      console.warn(`Error uploading events to Segment: ${JSON.stringify(error)}`)
      status = UploadResultStatus.Failed
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
}

const completed = (analytics: Analytics): Promise<any> => {
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