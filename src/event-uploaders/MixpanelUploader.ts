import BranchEvent from '../model/BranchEvent'
import { UploadResult, FailedEvent, UploadResultStatus, ExportService } from '../model/Models'
import { getFile, loadTemplates } from '../utils/s3'
import { templatesBucket } from '../utils/Config'
import { dateInFilename } from '../utils/StringUtils'
import { shouldUpload } from './UploaderFunctions'
import MixpanelEvent from '../model/MixpanelEvent'
import { MixpanelTransformer } from '../transformers/MixpanelTransformer'
import * as Mixpanel from 'mixpanel'
import { Secret, getSecret } from '../utils/Secrets'

export async function uploadToMixpanel(events: BranchEvent[], filename: string): Promise<UploadResult> {
  try {
    const excludedConfig = process.env.MIXPANEL_EXCLUDED_TOPICS
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
    console.debug(`Branch events: ${JSON.stringify(events)}`)
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      try {
        const mixpanelEvent = transformer.transform(event)
        if (!mixpanelEvent) {
          throw new Error(`Transform failed for event`)
        }
        transformedEvents.push(mixpanelEvent)
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
      throw new Error('No events available to upload to Mixpanel')
    }
    var eventsUploaded = 0
    try {
      await sendData(transformedEvents)
      console.info(`Events uploaded successfully to Mixpanel: ${eventsUploaded}`)
    } catch (error) {
      console.error(`Error uploading events to Mixpanel: ${error.message}`)
      status = UploadResultStatus.ContainsErrors
    }
    return {
      totalEvents: events.length,
      service: ExportService.Mixpanel,
      dateOfFile: dateInFilename(filename),
      file: filename,
      errors,
      status
    }
  }

  async function sendData(events: MixpanelEvent[]): Promise<void> {
    const token = await getSecret(Secret.MixpanelToken)
    const apiKey = await getSecret(Secret.MixpanelAPIKey)
    const mixpanel = Mixpanel.init(token, {
      key: apiKey,
      protocol: 'https'
    })
    return new Promise((resolve, reject) => {
      mixpanel.import_batch(events, (errors) => {
        if (!!errors) {
          reject(errors)
          return
        }
        resolve()
      })
    })
  }
}