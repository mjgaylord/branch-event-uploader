export default interface SegmentEvent {
  properties: any ,
  campaign?: {
    content?: string,
    medium?: string,
    name?: string,
    source?: string 
  },
  device?: {
    advertisingId?: string,
    id?: string 
  },
  idfa?: string,
  idfv?: string,
  aaid?: string,
  android_id?: string,
  ip?: string,
  user_agent?: string,
  os?: string,
}