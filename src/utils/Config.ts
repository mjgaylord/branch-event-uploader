import { ExportService, EventTopic } from "../model/Models"
import * as AWS from 'aws-sdk'

export const s3 = new AWS.S3({
  region: process.env.REGION
})

export const lambda = new AWS.Lambda({
  region: process.env.REGION
});

export const secretsManager = new AWS.SecretsManager({
  region: process.env.REGION
})

export const templatesBucket = process.env.TEMPLATES_BUCKET
export const filesTable = process.env.FILES_TABLE
export const batchUploadTableName = process.env.BATCH_UPLOAD_TABLE

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

export function includeOrganic(): Boolean {
  const value = process.env.INCLUDE_ORGANIC
  return (value === 'true')
}

export const excludedTopics = (config: string): Array<EventTopic> => {
  if (!config) {
    return []
  }
  return config.split(',')
    .map(s => s.trim().toLowerCase())
    .map(s => {
      switch (s) {
        case 'click':
          return EventTopic.Click
        case 'view':
          return EventTopic.View
        case 'commerce':
          return EventTopic.Commerce
        case 'content':
          return EventTopic.Content
        case 'install':
          return EventTopic.Install
        case 'open':
          return EventTopic.Open
        case 'pageview':
          return EventTopic.PageView
        case 'reinstall':
          return EventTopic.Reinstall
        case 'smssent':
          return EventTopic.SMSSent
        case 'userlifecycleevent':
          return EventTopic.UserLifecycleEvent
        case 'websessionstart':
          return EventTopic.WebSessionStart
        case 'webtoappautoredirect':
          return EventTopic.WebToAppAutoRedirect
      }
    })
    .filter(t => !!t)
}
