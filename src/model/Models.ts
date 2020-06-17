import BranchEvent from './BranchEvent'

export interface File {
  downloadPath: string
  batchCount?: number
  eventCount?: number
}

export interface DownloadDatabaseItem {
  downloadPath: string
  batchCount?: string
  eventCount?: string
}

export enum Destinations {
  Segment,
  Amplitude,
  mParticle
}

export interface FailedEvent {
  service: ExportService
  event: BranchEvent
  reason: string
}

export interface BatchUpload {
  filename: string
  sequence: number
  events?: BranchEvent[]
  status: UploadResultStatus
  errors?: FailedEvent[]
}

export interface BatchUploadDatabaseItem {
  identifier: string
  compressedEvents?: Buffer
  compressedErrors?: Buffer
  status: string
}

export interface UploadResult {
  totalBatches: number
  totalEvents: number
  file: string
  dateOfFile: string
  status: UploadResultStatus
}

export enum ExportService {
  None = 'None',
  Segment = 'Segment',
  Amplitude = 'Amplitude',
  Mixpanel = 'Mixpanel'
}

export enum EventTopic {
  Click = 'eo_click',
  View = 'eo_branch_cta_view',
  Commerce = 'eo_commerce_event',
  Content = 'eo_content_event',
  Install = 'eo_install',
  Open = 'eo_open',
  PageView = 'eo_pageview',
  Reinstall = 'eo_reinstall',
  SMSSent = 'eo_sms_sent',
  UserLifecycleEvent = 'eo_user_lifecycle_event',
  WebSessionStart = 'eo_web_session_start',
  WebToAppAutoRedirect = 'eo_web_to_app_auto_redirect'
}

export interface Response {
  statusCode: number
  body: string
  isBase64Encoded: boolean
}

export enum UploadResultStatus {
  NotUploaded = 0,
  Successful = 1,
  ContainsErrors = 2,
  Failed = 3
}
export function reducedStatus(statuses: UploadResultStatus[]): UploadResultStatus {
  return statuses.reduce((previousStatus: UploadResultStatus, status, _currentIndex, _array) => {
    if (previousStatus === UploadResultStatus.NotUploaded) {
        return UploadResultStatus.NotUploaded
    }
    if (previousStatus === UploadResultStatus.Failed && status !== UploadResultStatus.NotUploaded) {
        return UploadResultStatus.Failed
    }
    if (previousStatus === UploadResultStatus.ContainsErrors && 
        status !== UploadResultStatus.Failed && 
        status !== UploadResultStatus.NotUploaded) {
        return UploadResultStatus.ContainsErrors
    }
    return status
  }, UploadResultStatus.Successful)
}
