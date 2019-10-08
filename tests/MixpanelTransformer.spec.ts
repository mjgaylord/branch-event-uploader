import { testEvent } from './TestData'
import { enableFunctions } from '../src/model/BranchEvent'
import { ExportService } from '../src/model/Models'
import { MixpanelTransformer } from '../src/transformers/MixpanelTransformer'

describe('Mixpanel Transformer tests', () => {
  const event = testEvent
  var transformer: MixpanelTransformer
  beforeEach(async () => {
    enableFunctions(event, ExportService.Mixpanel)
    console.debug(`dir: ${__dirname}`)
    const templatePath = jest.requireActual('path')
      .join(__dirname, '../src/templates/mixpanel/MIXPANEL.mst')
    const partialPath = jest.requireActual('path')
      .join(__dirname, '../src/templates/mixpanel/partials/lastAttributedTouchData.partial')
    console.debug(`Template path: ${templatePath}`)
    const template = await readFile(templatePath)
    const partial = await readFile(partialPath)
    transformer = new MixpanelTransformer(template, { lastAttributedTouchData: partial })
  })

  it('Converts into mixpanel events', () => {
    const mixpanelEvent = transformer.transform(event)
    console.debug(`mixpanelEvent: ${JSON.stringify(mixpanelEvent)}`)
    expect(mixpanelEvent).toBeTruthy()
  })
})

async function readFile(path: string) :Promise<any> {
  return new Promise((resolve, reject) => {
    jest.requireActual('fs').readFile(path, 'utf8', (err, data) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}
