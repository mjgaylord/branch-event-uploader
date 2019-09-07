import BranchEvent from '../model/BranchEvent'
import { UploadResult, FailedEvent, UploadResultStatus, ExportService } from '../model/Models'
import { getFile, loadTemplates } from '../utils/s3'
import { templatesBucket } from '../config/Config'
import { dateInFilename } from '../utils/StringUtils'
import axios from 'axios'
import { AmplitudeTransformer } from '../transformers/AmplitudeTransformer'
import AmplitudeEvent from '../model/AmplitudeEvent'

export async function uploadToAmplitude(events: BranchEvent[], filename: string): Promise<UploadResult> {
  try {
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
    let errors = new Array<FailedEvent>()
    let transformedEvents = new Array<AmplitudeEvent>()
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      try {
        const amplitudeEvent = transformer.transform(event)
        if (!amplitudeEvent) {
          throw new Error(`Transform failed for event`)
        }
        transformedEvents.push(amplitudeEvent)
      } catch (error) {
        errors.push({ event, reason: JSON.stringify(error) })
      }
    }
    const result = await sendData(transformedEvents)

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
      messages: JSON.stringify(result),
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
        "api_key": process.env.AMPLITUDE_API_KEY,
        "events": events
      }
      const response = await api.post('/batch', body)
      console.debug('Uploading events to Amplitude...')
      return response
    } catch (error) {
      console.warn(`Error uploading events to Amplitude: ${error.message}`)
      throw error
    }
  }
}