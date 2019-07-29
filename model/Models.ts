export interface File {
    location: string,
    pathAvailable: boolean,
    downloaded: boolean,
    type: ServiceType,
}

export enum ServiceType {
    Branch,
    Tune
}

export interface Response {
    statusCode: number,
    body: string,
    isBase64Encoded: boolean
  }