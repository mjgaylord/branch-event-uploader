import BranchEvent from '../model/BranchEvent'
import { UploadResult, FailedEvent, UploadResultStatus, ExportService } from '../model/Models'
import { getFile, loadTemplates } from '../utils/s3'
import { templatesBucket } from '../utils/Config'
import { dateInFilename, hasData } from '../utils/StringUtils'
import axios from 'axios'
import { AmplitudeTransformer } from '../transformers/AmplitudeTransformer'
import AmplitudeEvent from '../model/AmplitudeEvent'
import { getSecret, Secret } from '../utils/Secrets'
import { shouldUpload } from './UploaderFunctions'
import { chunk } from '../utils/ArrayUtils'

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
    const template = await getFile(templatesBucket, 'amplitude/AMPLITUDE.mst')
    const partials = await loadTemplates(templatesBucket, 'amplitude/partials')
    const transformer = new AmplitudeTransformer(template, partials)
    var errors = new Array<FailedEvent>()
    var transformedEvents = new Array<AmplitudeEvent>()
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      try {
        const amplitudeEvent = transformer.transform(event)
        if (!amplitudeEvent) {
          throw new Error(`Transform failed for event`)
        }
        if (hasData(amplitudeEvent.device_id, amplitudeEvent.user_id)) {
          transformedEvents.push(amplitudeEvent)
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
    if (!!errors && errors.length === events.length) {
      status = UploadResultStatus.Failed
    } else if (!!errors && errors.length > 0) {
      status = UploadResultStatus.ContainsErrors
    }
    if (!transformedEvents || transformedEvents.length === 0) {
      throw new Error('No events available to upload to Amplitude')
    }
    var eventsUploaded = 0
    const chunks = chunk<AmplitudeEvent>(transformedEvents, 2000)
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

  async function sendData(events: AmplitudeEvent[]): Promise<any> {
    const api = axios.create({
      baseURL: "https://api.amplitude.com",
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
      }
    })
    try {
      const body = {
        "api_key": await getSecret(Secret.AmplitudeApiKey),
        "events": events
      }
      console.debug(`Uploading ${events.length} events to Amplitude...`)
      const response = await api.post('/batch', body)
      console.debug(`Amplitude upload completed with response: ${response.status}`)
      return response
    } catch (error) {
      console.warn(`Error uploading events to Amplitude: ${error.message}`)
      throw error
    }
  }
}