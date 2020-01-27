import { translateResponse } from '../src/handlers/StartExports'
import { responseData } from './TestData'

describe('StartExports functions', () => {
  it('File exclusion', () => {
    const response = translateResponse(responseData)
    expect(response.length).toEqual(10)
    const files = response.map(f => {
      return f.downloadPath
    })
    expect(files).toContain('https://branch-exports-web.s3.amazonaws.com/620000000000000000-2020-01-17-eo_open-v2-a644b2402c165d43794fd5fb449b0f7934b1fe75e17a8c3bbb41b8ae09e21ee6-NTA3Qp.csv.gz?Signature=None=&AWSAccessKeyId=FAKEAKKEY12345678901&Expires=1579950963')
    expect(files).toContain('https://branch-exports-web.s3.amazonaws.com/620000000000000000-2020-01-17-eo_click-v2-76a8cedfcdd57791c2911a7b3c630c5a8fddfdf3c48a3b460f64e33334ae5bea-M2gcEH.csv.gz?Signature=None=&AWSAccessKeyId=FAKEAKKEY12345678901&Expires=1579950371')
    expect(files).toContain('https://branch-exports-web.s3.amazonaws.com/620000000000000000-2020-01-17-eo_web_session_start-v2-213cdc5a2b58453e71d19764c746137a76d6190af8ae789668a1b18609752f49-hDtt2P.csv.gz?Signature=None=&AWSAccessKeyId=FAKEAKKEY12345678901&Expires=1579951453')
  })  
})