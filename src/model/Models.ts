import BranchEvent from "./BranchEvent";

export interface File {
    downloadPath: string,
    pathAvailable: boolean,
    downloaded: boolean,
    type: ServiceType,
}

export interface DatabaseItem {
    downloaded: string, 
    downloadPath: string,
    type: string,
    pathAvailable: string
}

export enum ServiceType {
    Branch,
    Tune
}

export enum Destinations {
    Segment,
    Amplitude,
    mParticle,
}

export interface FailedEvent {
    event: BranchEvent,
    reason: String
}

export interface UploadResult {
    service: ExportService
    errors: Array<FailedEvent>,
    totalEvents: number,
    file: string,
    dateOfFile: string,
    status: UploadResultStatus,
    messages?: string
}

export enum ExportService {
    None = "None",
    Segment = "Segment",
    Amplitude = "Amplitude",
    Mixpanel = "Mixpanel"
}

export enum EventTopic {
    Click = "eo_click",
    View = "eo_branch_cta_view",
	Commerce = "eo_commerce_event",
    Content = "eo_content_event",
    Install = "eo_install",
    Open = "eo_open",
    PageView = "eo_pageview",
    Reinstall = "eo_reinstall",
    SMSSent = "eo_sms_sent",
    UserLifecycleEvent = "eo_user_lifecycle_event",
    WebSessionStart = "eo_web_session_start",
    WebToAppAutoRedirect = "eo_web_to_app_auto_redirect"
}

export interface Response {
    statusCode: number,
    body: string,
    isBase64Encoded: boolean
}

export enum UploadResultStatus {
    Successful,
    ContainsErrors,
    Failed
}

export interface JobReport {
    service: String,
    date: String,
    events_count: number,
    failed_events_count: number,
    messages?: String[],
    errors?: String[]
}