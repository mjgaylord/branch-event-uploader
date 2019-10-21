import { UploadResultStatus, reducedStatus } from '../src/model/Models'

describe('Model tests', () => {
  it('Reducing status works correctly', () => {
    expect(UploadResultStatus.NotUploaded).toEqual(reducedStatus([
      UploadResultStatus.ContainsErrors, 
      UploadResultStatus.Failed, 
      UploadResultStatus.NotUploaded, 
      UploadResultStatus.Successful
    ]))
    expect(UploadResultStatus.Failed).toEqual(reducedStatus([
      UploadResultStatus.ContainsErrors, 
      UploadResultStatus.Failed, 
      UploadResultStatus.Successful
    ]))
    expect(UploadResultStatus.ContainsErrors).toEqual(reducedStatus([
      UploadResultStatus.ContainsErrors, 
      UploadResultStatus.Successful
    ]))
    expect(UploadResultStatus.Successful).toEqual(reducedStatus([ 
      UploadResultStatus.Successful
    ]))
    expect(UploadResultStatus.Successful).toEqual(reducedStatus([]))
  })
})