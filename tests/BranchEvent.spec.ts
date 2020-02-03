import { testEvent } from './TestData'
import { enableFunctions, isOrganic } from '../src/model/BranchEvent'
import { ExportService } from '../src/model/Models'
import { hasData } from '../src/utils/StringUtils'
import AmplitudeEvent from '../src/model/AmplitudeEvent'

describe('Transform functions', () => {
  const event = testEvent
  beforeEach(() => {
    enableFunctions(event, ExportService.Amplitude)
  })

  it('Converts timestamp to millis', () => {
    const timestamp = event.timestamp
    const millis = event.timestampMillisFunction()
    expect(Math.ceil(timestamp / 1000)).toEqual(millis)
  })

  it('Extracts touch data', () => {
    const expectedResult = {
      last_attributed_touch_data_tilde_campaign: 'Top vs Bottom Banner A/B Test',
      last_attributed_touch_data_tilde_campaign_id: 'lksjdfosijosidjfosidjf',
      last_attributed_touch_data_tilde_channel: 'Some Channel',
      last_attributed_touch_data_tilde_feature: 'journeys',
      last_attributed_touch_data_tilde_stage: 'Some Stage',
      last_attributed_touch_data_tilde_journey_name: 'Top vs Bottom Banner A/B Test',
      last_attributed_touch_data_tilde_journey_id: '5bfc84012503fecd2e596f25',
      last_attributed_touch_data_tilde_view_name: 'Bottom Banner',
      last_attributed_touch_data_tilde_view_id: '595747715178848265',
      $og_title:'Journeys Commerce Events',
      '+url':'https://branch-demo.app.link/09wURzIDbW',
      '~creation_source':5,
      $og_description:'QA Tests for Commerce v2 Events',
      $og_video:'http://qaauto.branch.io/video',
      $one_time_use:false,
      $canonical_url:'http://qaauto.branch.io/qa/test_cases/journey_banner20.html',
      $uri_redirect_mode:1,
      $og_image_url:'http://branch.io/img/logo_icon_black.png'
    }
    const result = JSON.parse(event.touchDataFunction())
    Object.keys(expectedResult).forEach(k => {
      expect(expectedResult[k]).toEqual(result[k])
    })
  })

  it('Extracts Amplitude user id', () => {
    const result = event.userIdFunction()
    expect(result).toEqual('amplitude_identity')
  })

  it('Extracts developer identity', () => {
    enableFunctions(event, ExportService.None)
    const result = event.userIdFunction()
    expect(result).toEqual('someidentity@identity.com')
  })

  it('Extracts any device id', () => {
    event.user_data_aaid = '2f3ff5df-fd74-0bfa-1286-70755d580118'
    let result = event.deviceIdFunction()
    expect(event.user_data_aaid).toEqual(result)
    
    event.user_data_aaid = ''
    event.user_data_idfa = "2f3ff5df-fd74-0bfa-1286-70755d580118"
    result = event.deviceIdFunction()
    expect(event.user_data_idfa).toEqual(result)
  })

  it('Returns a joined string off of a tags array', () => {
    const expectedResult = "Bottom Banner,An awesome banner,Somewhere on this webpage"
    const result = event.joinedTagsFunction()
    expect(result).toEqual(expectedResult)
  })

  it('Returns a joined string off of a features array', () => {
    const expectedResult = "Homepage Feature,Another feature,One more feature"
    const result = event.joinedFeaturesFunction()
    expect(result).toEqual(expectedResult)
  })

  it('Returns Mixpanel touch data', () => {
    enableFunctions(event, ExportService.Mixpanel)
    const result = event.touchDataFunction()
    expect(result).toBeTruthy()
  })

  it('Returns false if hasData is undefined', () => {
    const values: AmplitudeEvent = {}
    expect(hasData(values.device_id, values.user_id)).toEqual(false)
  })

  it('Returns true if hasData is defined', () => {
    const values: AmplitudeEvent = {device_id: '123456789', user_id: '1234456788'}
    expect(hasData(values.device_id, values.user_id)).toEqual(true)
  })

  it('Returns false for organic event', () => {
    const value = isOrganic(event)
    expect(value).toBeFalsy()
  })

  it('Returns true for organic event', () => {
    event.last_attributed_touch_type = ""
    const value = isOrganic(event)
    expect(value).toBeTruthy()
  })
})
