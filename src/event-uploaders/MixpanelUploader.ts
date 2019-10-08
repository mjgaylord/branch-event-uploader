import BranchEvent from '../model/BranchEvent'
import { UploadResult, FailedEvent, UploadResultStatus, ExportService } from '../model/Models'
import { getFile, loadTemplates } from '../utils/s3'
import { templatesBucket } from '../utils/Config'
import { dateInFilename, hasData } from '../utils/StringUtils'
import { shouldUpload } from './UploaderFunctions'
import { chunk } from '../utils/ArrayUtils'
import MixpanelEvent from '../model/MixpanelEvent'
import { MixpanelTransformer } from '../transformers/MixpanelTransformer'

export async function uploadToAmplitude(events: BranchEvent[], filename: string): Promise<UploadResult> {
  try {
    const excludedConfig = process.env.AMPLITUDE_EXCLUDED_TOPICS
    if (!shouldUpload(filename, excludedConfig)) {
      const message = `File - ${filename} marked as excluded, skipping...`
      console.info(message)
      return
    }
    console.debug(`Uploading file: ${filename}`)
    return upload(events, filename)
  } catch (error) {
    return {
      service: ExportService.Amplitude,
      errors: [error],
      totalEvents: events.length,
      file: filename,
      dateOfFile: dateInFilename(filename),
      status: UploadResultStatus.Failed
    }
  }

  async function upload(events: BranchEvent[], filename: string): Promise<UploadResult> {
    const template = await getFile(templatesBucket, 'mixpanel/MIXPANEL.mst')
    const partials = await loadTemplates(templatesBucket, 'mixpanel/partials')
    const transformer = new MixpanelTransformer(template, partials)
    var errors = new Array<FailedEvent>()
    var transformedEvents = new Array<MixpanelEvent>()
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      try {
        const mixpanelEvent = transformer.transform(event)
        if (!mixpanelEvent) {
          throw new Error(`Transform failed for event`)
        }
        if (hasData(mixpanelEvent.distinct_id)) {
          transformedEvents.push(mixpanelEvent)
        } else {
          const errorMessage = `Skipped event due to missing deviceId or userId`
          console.debug(errorMessage)
          errors.push({ event, reason:  errorMessage})
        }
      } catch (error) {
        console.error(`Error transforming event: ${JSON.stringify(error)}`)
        errors.push({ event, reason: JSON.stringify(error) })
      }
    }
    var status = UploadResultStatus.Successful
    if (errors.length === events.length) {
      status = UploadResultStatus.Failed
    } else if (errors.length > 0) {
      status = UploadResultStatus.ContainsErrors
    }
    if (transformedEvents.length === 0) {
      throw new Error('No events available to upload to Amplitude')
    }
    var eventsUploaded = 0
    const chunks = chunk<MixpanelEvent>(transformedEvents, 2000)
    chunks.forEach(async (e) => {
      try {
        await sendData(e)
        eventsUploaded += e.length
        console.info(`Events uploaded successfully to Amplitude: ${eventsUploaded}`)
      } catch (error) {
        console.error(`Error uploading events to Amplitude: ${error.message}`)
        status = UploadResultStatus.ContainsErrors
      }
    })
    return {
      totalEvents: events.length,
      service: ExportService.Amplitude,
      dateOfFile: dateInFilename(filename),
      file: filename,
      errors,
      status
    }
  }

  async function sendData(events: MixpanelEvent[]): Promise<any> {
    
  }
}