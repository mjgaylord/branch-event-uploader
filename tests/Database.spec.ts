import { File, BatchUpload, UploadResultStatus } from '../src/model/Models'
import { fileToItem, itemToFile, appendMetrics, batchUploadToItem, itemToBatchUpload } from '../src/database/Database'
import { testEvent } from './TestData'

describe('Transform functions', () => {
  const file: File = {
    downloadPath: 'https://branch-demo-data-export-scheduler-dev-exports-bucket.s3.amazonaws.com/545541699229733113-2019-09-10-eo_custom_event-v2-28caae5790f83991ede4aac18dd55ed3fc50061d1ca3f76d3016d75fe9a3e2ea-63dzUe.csv',
  }

  const batchUpload: BatchUpload = {
    events: [testEvent],
    filename: '545541699229733113-2019-09-10-eo_custom_event-v2-28caae5790f83991ede4aac18dd55ed3fc50061d1ca3f76d3016d75fe9a3e2ea-63dzUe.csv',
    sequence: 1,
    status: UploadResultStatus.NotUploaded,
    errors: []
  }

  it('Converts file to database item and reverses it correctly', () => {
    const item = fileToItem(file)
    const reverse = itemToFile(item)
    Object.keys(reverse).forEach( key => {
      expect(file[key]).toEqual(reverse[key])
    })
  })

  it('Appends metrics correctly', () => {
    const batchCount = 10
    const eventCount = 1000
    const updated = appendMetrics(file, batchCount, eventCount)
    const item = fileToItem(updated)
    expect(updated.batchCount).toEqual(batchCount)
    expect(updated.eventCount).toEqual(eventCount)
    expect(item.batchCount).toEqual(`${batchCount}`)
    expect(item.eventCount).toEqual(`${eventCount}`)

    const reverse = itemToFile(updated)
    Object.keys(reverse).forEach( key => {
      expect(updated[key]).toEqual(reverse[key])
    })
  })

  it(`Converts a batch upload to item and reverses it correctly`, async (complete) => {
    const item = await batchUploadToItem(batchUpload)
    const reverse = await itemToBatchUpload(item)
    Object.keys(reverse).forEach( key => {
      expect(batchUpload[key]).toEqual(reverse[key])
    })
    complete()
  })
})