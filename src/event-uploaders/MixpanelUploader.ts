import BranchEvent from '../model/BranchEvent'
import { FailedEvent, ExportService } from '../model/Models'
import { getFile, loadTemplates } from '../utils/s3'
import { templatesBucket } from '../utils/Config'
import { shouldUpload } from './UploaderFunctions'
import MixpanelEvent from '../model/MixpanelEvent'
import { MixpanelTransformer } from '../transformers/MixpanelTransformer'
import * as Mixpanel from 'mixpanel'
import { Secret, getSecret } from '../utils/Secrets'

export async function uploadToMixpanel(events: BranchEvent[], filename: string): Promise<FailedEvent[]> {
  try {
    const excludedConfig = process.env.MIXPANEL_EXCLUDED_TOPICS
    if (!shouldUpload(filename, excludedConfig)) {
      const message = `File - ${filename} marked as excluded, skipping...`
      console.info(message)
      return
    }
    return upload(events)
  } catch (error) {
    console.error(`Error uploading to Mixpanel: ${error}`)
    return events.map(event => {
      return {
        event,
        service: ExportService.Mixpanel,
        reason: JSON.stringify(error)
      }
    })
  }
}

async function upload(events: BranchEvent[]): Promise<FailedEvent[]> {
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
      transformedEvents.push(mixpanelEvent)
    } catch (error) {
      console.error(`Error transforming event: ${JSON.stringify(error)}`)
      errors.push({
        event,
        service: ExportService.Mixpanel,
        reason: JSON.stringify(error)
      })
    }
  }
  if (transformedEvents.length === 0) {
    throw new Error('No events available to upload to Mixpanel')
  }
  const token = await getSecret(Secret.MixpanelToken)
  const apiKey = await getSecret(Secret.MixpanelAPIKey)
  await sendData(transformedEvents, token, apiKey)
  console.info(`Events uploaded successfully to Mixpanel: ${transformedEvents.length}`)
  return errors
}

async function sendData(events: MixpanelEvent[], token: string, apiKey: string): Promise<void> {
  const mixpanel = Mixpanel.init(token, {
    key: apiKey,
    protocol: 'https'
  })
  return new Promise((resolve, reject) => {
    mixpanel.import_batch(events, errors => {
      if (!!errors) {
        reject(errors)
        return
      }
      resolve()
    })
  })
}
