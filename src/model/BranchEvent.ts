import { ExportService } from './Models'

export default interface BranchEvent {
    exportService: ExportService
    id: number,
    name: string,
    timestamp: number,
    timestamp_iso: string,
    origin: string,
    last_attributed_touch_type: string,
    last_attributed_touch_timestamp: string,
    last_attributed_touch_timestamp_iso: string,
    last_attributed_touch_data_tilde_id: string,
    last_attributed_touch_data_tilde_campaign: string,
    last_attributed_touch_data_tilde_campaign_id: string,
    last_attributed_touch_data_tilde_channel: string,
    last_attributed_touch_data_tilde_feature: string,
    last_attributed_touch_data_tilde_stage: string,
    last_attributed_touch_data_tilde_tags: string,
    last_attributed_touch_data_tilde_advertising_partner_name: string,
    last_attributed_touch_data_tilde_secondary_publisher: string,
    last_attributed_touch_data_tilde_creative_name: string,
    last_attributed_touch_data_tilde_creative_id: string,
    last_attributed_touch_data_tilde_ad_set_name: string,
    last_attributed_touch_data_tilde_ad_set_id: string,
    last_attributed_touch_data_tilde_ad_name: string,
    last_attributed_touch_data_tilde_ad_id: string,
    last_attributed_touch_data_tilde_branch_ad_format: string,
    last_attributed_touch_data_tilde_technology_partner: string,
    last_attributed_touch_data_tilde_banner_dimensions: string,
    last_attributed_touch_data_tilde_placement: string,
    last_attributed_touch_data_tilde_keyword_id: string,
    last_attributed_touch_data_tilde_agency: string,
    last_attributed_touch_data_tilde_optimization_model: string,
    last_attributed_touch_data_tilde_secondary_ad_format: string,
    last_attributed_touch_data_tilde_journey_name: string,
    last_attributed_touch_data_tilde_journey_id: string,
    last_attributed_touch_data_tilde_view_name: string,
    last_attributed_touch_data_tilde_view_id: string,
    last_attributed_touch_data_plus_current_feature: string,
    last_attributed_touch_data_plus_via_features: string,
    last_attributed_touch_data_dollar_3p: string,
    last_attributed_touch_data_plus_web_format: string,
    last_attributed_touch_data_custom_fields: any,
    days_from_last_attributed_touch_to_event: string,
    hours_from_last_attributed_touch_to_event: string,
    minutes_from_last_attributed_touch_to_event: string,
    seconds_from_last_attributed_touch_to_event: string,
    last_cta_view_timestamp: string,
    last_cta_view_timestamp_iso: string,
    last_cta_view_data_tilde_id: string,
    last_cta_view_data_tilde_campaign: string,
    last_cta_view_data_tilde_campaign_id: string,
    last_cta_view_data_tilde_channel: string,
    last_cta_view_data_tilde_feature: string,
    last_cta_view_data_tilde_stage: string,
    last_cta_view_data_tilde_tags: string,
    last_cta_view_data_tilde_advertising_partner_name: string,
    last_cta_view_data_tilde_secondary_publisher: string,
    last_cta_view_data_tilde_creative_name: string,
    last_cta_view_data_tilde_creative_id: string,
    last_cta_view_data_tilde_ad_set_name: string,
    last_cta_view_data_tilde_ad_set_id: string,
    last_cta_view_data_tilde_ad_name: string,
    last_cta_view_data_tilde_ad_id: string,
    last_cta_view_data_tilde_branch_ad_format: string,
    last_cta_view_data_tilde_technology_partner: string,
    last_cta_view_data_tilde_banner_dimensions: string,
    last_cta_view_data_tilde_placement: string,
    last_cta_view_data_tilde_keyword_id: string,
    last_cta_view_data_tilde_agency: string,
    last_cta_view_data_tilde_optimization_model: string,
    last_cta_view_data_tilde_secondary_ad_format: string,
    last_cta_view_data_plus_via_features: string,
    last_cta_view_data_dollar_3p: string,
    last_cta_view_data_plus_web_format: string,
    last_cta_view_data_custom_fields: string,
    deep_linked: string,
    first_event_for_user: string,
    user_data_os: string,
    user_data_os_version: string,
    user_data_model: string,
    user_data_browser: string,
    user_data_geo_country_code: string,
    user_data_app_version: string,
    user_data_sdk_version: string,
    user_data_geo_dma_code: number,
    user_data_environment: string,
    user_data_platform: string,
    user_data_aaid: string,
    user_data_idfa: string,
    user_data_idfv: string,
    user_data_android_id: string,
    user_data_limit_ad_tracking: string,
    user_data_user_agent: string,
    user_data_ip: string,
    user_data_developer_identity: string,
    user_data_language: string,
    user_data_brand: string,
    di_match_click_token: number,
    event_data_revenue_in_usd: string,
    event_data_exchange_rate: string,
    event_data_transaction_id: string,
    event_data_revenue: string,
    event_data_currency: string,
    event_data_shipping: string,
    event_data_tax: string,
    event_data_coupon: string,
    event_data_affiliation: string,
    event_data_search_query: string,
    event_data_description: string,
    custom_data: string,
    last_attributed_touch_data_tilde_keyword: string,
    user_data_cross_platform_id: string,
    user_data_past_cross_platform_ids: string,
    user_data_prob_cross_platform_ids: string,
    store_install_begin_timestamp: string,
    referrer_click_timestamp: string,
    user_data_os_version_android: string,
    user_data_geo_city_code: number,
    user_data_geo_city_en: string,
    user_data_http_referrer: string,
    event_timestamp: number,
    customer_event_alias: string,
    last_attributed_touch_data_tilde_customer_campaign: string,
    last_attributed_touch_data_tilde_campaign_type: string,
    last_cta_view_data_tilde_campaign_type: string,
    last_attributed_touch_data_tilde_agency_id: string,
    last_attributed_touch_data_plus_touch_id: string,
    last_cta_view_data_plus_touch_id: string,
    user_data_installer_package_name: string,
    user_data_cpu_type: string,
    user_data_screen_width?: number,
    user_data_screen_height?: number,
    user_data_build: string,
    user_data_internet_connection_type: string,
    hash_version: string,

    // Functions - each of these need to be defined and enabled below
    timestampMillisFunction?: Function,
    joinedTagsFunction?: Function,
    lowerCasedFunction?: Function,
    touchDataFunction?: Function,
    deviceIdFunction?: Function,
    userIdFunction?: Function,
    joinedFeaturesFunction?: Function,
}

const TimestampMillis = function (): number {
    if (!this.timestamp) {
        return (new Date()).getTime()
    }
    return Math.ceil(this.timestamp / 1000)
}

const JoinedTags = function (): string {
    const tagString: string = this.last_attributed_touch_data_tilde_tags
    if (tagString.length === 0) {
        return ''
    }
    const tags = JSON.parse(tagString)
    return tags.join(',')
}

const JoinedFeatures = function (): string {
    const featuresString: string = this.last_attributed_touch_data_plus_via_features
    if (featuresString.length === 0) {
        return ''
    }
    const features = JSON.parse(featuresString)
    return features.join(',')
}

const LowerCased = function (): Function {
    return (text: string, render: Function) => {
        return render(text).toLowerCase()
    }
}

const TouchData = function (): string {
    const exclusions = this.exportService === ExportService.Mixpanel ? 
    ["last_attributed_touch_data_custom_fields", 
    "last_attributed_touch_data_plus_via_features", 
    "last_attributed_touch_data_tilde_tags"] : []

    var lastAttributedTouchData = {}
    for (const key of Object.keys(this)) {
        const value = this[key]
        if (key !== 'last_attributed_touch_data_custom_fields' &&
            key.startsWith('last_attributed_touch_data') &&
            exclusions.indexOf(key) < 0 && value.length > 0) {
            lastAttributedTouchData[key] = value
        }
    }
    try {
        if (!!this.last_attributed_touch_data_custom_fields && this.last_attributed_touch_data_custom_fields.length > 0) {
            const deserializedCustomFields = JSON.parse(this.last_attributed_touch_data_custom_fields)
            lastAttributedTouchData = {...deserializedCustomFields, ...lastAttributedTouchData}
        } 
    } catch (error) {
        console.warn(`Errors deserializing custom fields: ${this.last_attributed_touch_data_custom_fields}\nerror: ${error}`)
    }
    return JSON.stringify(lastAttributedTouchData)
}

const AnyDeviceId = function (): string | undefined {
    if (typeof this === 'string') { //hack for now, need to understand why the device id is being called twice here
        return this
    }
    const device = this.user_data_aaid || this.user_data_android_id || this.user_data_idfa || this.user_data_idfv
    return device
}

const UserId = function(): string | undefined {
    if (typeof this === 'string') {
        return this
    }
    try {
        const parsed = JSON.parse(this.custom_data)
        switch (this.exportService) {
            case ExportService.Mixpanel:
                return parsed.$mixpanel_distinct_id || this.user_data_developer_identity
            case ExportService.Amplitude:
                return parsed.$amplitude_user_id || this.user_data_developer_identity
        }
    } catch (error) {
        console.debug(`Error parsing custom_data on event: ${this.custom_data} error: ${error}`)
    }
    return this.user_data_developer_identity
}

export function enableFunctions(event: BranchEvent, service: ExportService) {
    event.exportService = service
    event.timestampMillisFunction = TimestampMillis
    event.joinedTagsFunction = JoinedTags
    event.lowerCasedFunction = LowerCased
    event.deviceIdFunction = AnyDeviceId
    event.joinedFeaturesFunction = JoinedFeatures
    event.touchDataFunction = TouchData
    event.userIdFunction = UserId
}