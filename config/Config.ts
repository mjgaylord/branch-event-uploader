import { ServiceType, ExportService, EventTopic } from "../model/Models"
import * as AWS from 'aws-sdk'

export function serviceType(): ServiceType {
  const env = process.env.SERVICE_TYPE || 'Branch'
  if (env === 'Tune') {
    return ServiceType.Tune
  }
  return ServiceType.Branch
}

export const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.ACCESS_SECRET_KEY,
  region: 'us-east-1'
})

export const lambda = new AWS.Lambda({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.ACCESS_SECRET_KEY,
  region: 'us-east-1'
});

export const templatesBucket = process.env.TEMPLATES_BUCKET
export const reportReceivers = process.env.REPORT_RECEIVER_MAIL
export const reportSender = process.env.REPORT_SENDER_MAIL

export function configuredServices(): Array<ExportService> {
  const services = process.env.EXPORT_SERVICES.split(',')
    .map(s => s.trim())
    .map(s => {
      switch (s) {
        case 'Amplitude':
          return ExportService.Amplitude
        case 'Mixpanel':
          return ExportService.Mixpanel
        case 'Segment':
          return ExportService.Segment
      }
    })
    .filter(s => !!s)
  if (services.length === 0) {
    return [ExportService.None]
  }
  return services
}

export const excludedTopics = (): Array<EventTopic> => {
  return process.env.EXPORT_SERVICES.split(',')
    .map(s => s.trim())
    .map(s => {
      switch (s) {
        case 'Click':
          return EventTopic.Click
        case 'View':
          return EventTopic.View
        case 'Commerce':
          return EventTopic.Commerce
        case 'Content':
          return EventTopic.Content
        case 'Install':
          return EventTopic.Install
        case 'Open':
          return EventTopic.Open
        case 'PageView':
          return EventTopic.PageView
        case 'Reinstall':
          return EventTopic.Reinstall
        case 'SMSSent':
          return EventTopic.SMSSent
        case 'UserLifecycleEvent':
          return EventTopic.UserLifecycleEvent
        case 'WebSessionStart':
          return EventTopic.WebSessionStart
        case 'WebToAppAutoRedirect':
          return EventTopic.WebToAppAutoRedirect
      }
    })
    .filter(t => !!t)
}
