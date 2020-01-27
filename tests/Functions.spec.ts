import { shouldUpload } from '../src/event-uploaders/UploaderFunctions'

describe('Uploader Functions tests', () => {
  const clicks = `388787843096400122-2019-08-04-eo_click-v2-2124961cb67906385dffa057b403feb9be6711dc72ad958aad75fbe535fe7ce6-j3n6vt-test.csv`
  it('File exclusion', () => {
    const value = shouldUpload(clicks, 'CLICK')
    expect(value).toBeFalsy()
  })

  it('File inclusion', () => {
    const value = shouldUpload(clicks, 'open')
    expect(value).toBeTruthy()
  })

  it('Empty config', () => {
    const value = shouldUpload(clicks, '')
    expect(value).toBeTruthy()
  })

  it('Multiple files config', () => {
    const value = shouldUpload(clicks, 'open,click')
    expect(value).toBeFalsy()
  })
})