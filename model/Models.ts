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
    errors: Array<FailedEvent>,
    totalEvents: number,
    file: string
}

export function typeToString(type: ServiceType) {
    switch (type) {
        case ServiceType.Branch:
            return 'Branch'
        case ServiceType.Tune:
            return 'Tune'
    }
}

export function typeFromValue(value: string) {
    if (value === typeToString(ServiceType.Tune)) {
        return ServiceType.Tune
    }
    return ServiceType.Branch
}

export interface Response {
    statusCode: number,
    body: string,
    isBase64Encoded: boolean
  }