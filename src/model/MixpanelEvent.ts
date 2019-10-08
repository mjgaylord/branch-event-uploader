export default interface MixpanelEvent {
  event: string,
  properties: {
    time: Date,
    distinct_id: string
  }
}