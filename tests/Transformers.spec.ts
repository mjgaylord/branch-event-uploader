import { testEvent } from './TestData'
import { enableFunctions } from '../src/model/BranchEvent'
import { ExportService } from '../src/model/Models'
import { MixpanelTransformer } from '../src/transformers/MixpanelTransformer'
import { AmplitudeTransformer } from '../src/transformers/AmplitudeTransformer'
import { SegmentTransformer } from '../src/transformers/SegmentTransformer'

describe('Mixpanel Transformer tests', () => {
  const event = testEvent
  var transformer: MixpanelTransformer
  beforeEach(async () => {
    enableFunctions(event, ExportService.Mixpanel)
    const { template, partials } = await loadTemplatesAndPartials(ExportService.Amplitude)
    transformer = new MixpanelTransformer(template, partials)
  })
  
  it('Converts into mixpanel events', () => {
    const mixpanelEvent = transformer.transform(event)
    console.debug(`mixpanelEvent: ${JSON.stringify(mixpanelEvent)}`)
    expect(mixpanelEvent).toBeTruthy()
  })
})

describe('Amplitude Transformer tests', () => {
  const event = testEvent
  var transformer: AmplitudeTransformer
  beforeEach(async () => {
    enableFunctions(event, ExportService.Amplitude)
    const { template, partials } = await loadTemplatesAndPartials(ExportService.Amplitude)
    transformer = new AmplitudeTransformer(template, partials)
  })

  it('Converts into amplitude events', () => {
    const amplitudeEvent = transformer.transform(event)
    console.debug(`amplitudeEvent: ${JSON.stringify(amplitudeEvent)}`)
    expect(amplitudeEvent).toBeTruthy()
  })
})

describe('Segment Transformer tests', () => {
  const event = testEvent
  var transformer: SegmentTransformer
  beforeEach(async () => {
    enableFunctions(event, ExportService.Segment)
    const { template, partials } = await loadTemplatesAndPartials(ExportService.Segment)
    transformer = new SegmentTransformer(template, partials)
  })

  it('Converts into segment events', () => {
    const segmentEvent = transformer.transform(event)
    console.debug(`segmentEvent: ${JSON.stringify(segmentEvent)}`)
    expect(segmentEvent).toBeTruthy()
  })
})

async function readFile(path: string): Promise<any> {
  console.debug(`readinf file: ${path}`)
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

export async function loadTemplatesAndPartials(service: ExportService): Promise<{ template: string; partials: {} }> {
  const templatePath = jest.requireActual('path').join(__dirname, pathForService(service), templateForService(service))
  console.debug(`Template path: ${templatePath}`)
  const template = await readFile(templatePath)
  console.debug(`template: ${template}`)
  const partials = await getPartials(service)
  console.debug(`partials: ${JSON.stringify(partials)}`)
  return { template, partials }
}

async function getPartials(service: ExportService): Promise<{}> {
  const partialPath = jest
    .requireActual('path')
    .join(__dirname, pathForService(service), '/partials')
    const files = await readDir(partialPath)
    
    const promises = await Promise.all(files.map(async o => {
      const path = jest.requireActual('path').join(partialPath, o)
      console.debug(`loading: ${path}`)
      return nameAndContents(path)
    }))
    var partials = {}
    promises.forEach(p => {
      partials = {...partials, ...p}
    })
    return partials
}

async function readDir(path: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    jest.requireActual('fs').readdir(path, async (err, files) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(files)
    })
  })
}

async function nameAndContents(path: string): Promise<{}> {
  let object = {}
  const { name } = jest.requireActual('path').parse(path)
  const partial = await readFile(path)
  console.debug(`partial: ${partial}`)
  object[name] = partial
  return object
}


function pathForService(service: ExportService): string {
  switch (service) {
    case ExportService.Amplitude:
      return '../src/templates/amplitude/'
    case ExportService.Mixpanel:
      return '../src/templates/mixpanel/'
    case ExportService.Segment:
      return '../src/templates/segment/'
    default:
      return ''
  }
}

function templateForService(service: ExportService): string {
  switch (service) {
    case ExportService.Amplitude:
      return 'AMPLITUDE.mst'
    case ExportService.Mixpanel:
      return 'MIXPANEL.mst'
    case ExportService.Segment:
      return 'SEGMENT.mst'
    default:
      return ''
  }
}