//@ts-ignore
import Analytics from 'analytics-node'
import BranchEvent from '../model/BranchEvent'
import { UploadResult, FailedEvent, UploadResultStatus, ExportService } from '../model/Models'
import { getFile, loadTemplates } from '../utils/s3'
import { SegmentTransformer } from '../transformers/SegmentTransformer'
import { templatesBucket } from '../config/Config'
import { dateInFilename } from '../utils/StringUtils'

const analytics = new Analytics(process.env.SEGMENT_WRITE_KEY)

export async function uploadToSegment(events: BranchEvent[], filename: string): Promise<UploadResult> {
  try {
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
}