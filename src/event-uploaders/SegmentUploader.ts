//@ts-ignore
import Analytics from 'analytics-node'
import BranchEvent from '../model/BranchEvent'
import { FailedEvent, ExportService } from '../model/Models'
import { getFile, loadTemplates } from '../utils/s3'
import { SegmentTransformer } from '../transformers/SegmentTransformer'
import { templatesBucket } from '../utils/Config'
import { getSecret, Secret } from '../utils/Secrets'
import { shouldUpload } from './UploaderFunctions'

export async function uploadToSegment(events: BranchEvent[], filename: string): Promise<FailedEvent[]> {
  try {
    const excludedConfig = process.env.SEGMENT_EXCLUDED_TOPICS
    if (!shouldUpload(filename, excludedConfig)) {
      const message = `File - ${filename} marked as excluded, skipping...`
      console.info(message)
      return
    }
    return upload(events)
  } catch (error) {
    console.error(`Uploading to Segment failed due to: ${error}`)
    return events.map(event => {
      return {
        event, 
        service: ExportService.Segment, 
        reason: JSON.stringify(error)
      }
    })
  }

  async function upload(events: BranchEvent[]): Promise<FailedEvent[]> {
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
        errors.push({ event, service: ExportService.Segment, reason: JSON.stringify(error) })
      }
    }
    await completed(analytics)
    return errors
  }
}

const completed = (analytics: Analytics): Promise<any> => {
  return new Promise((resolve, reject) => {
    console.debug('Flushing Segment data...')
    analytics.flush((err, batch) => {
      if (!!err) {
        reject(err)
        return
      }
      console.debug('Segment data flushed successfully.')
      resolve(batch)
    })
  })
}