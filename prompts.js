const topics = [
  "Click",
  "View",
  "Commerce",
  "Content",
  "Install",
  "Open",
  "PageView",
  "Reinstall",
  "SMSSent",
  "UserLifecycleEvent",
  "WebSessionStart",
  "WebToAppAutoRedirect"
]

module.exports.prompts = function () {
  return {
    properties: {
      appName: {
        description: 'Enter your AWS app name',
        pattern: /^[a-zA-Z\-]+$/,
        message: 'App name must be only letters and dashes',
        required: true
      },
      stage: {
        description: 'Enter a stage e.g. dev, stg, prd (default is dev)',
      },
      region: {
        description: 'Enter region (default: us-east-1)',
        default: 'us-east-1'
      },
      downloadsBucket: {
        description: 'Provide your S3 bucket name where your Branch export files are located',
        pattern: /^[a-zA-Z0-9\+\/\=]+$/,
        message: 'Invalid bucket name',
        required: true
      },
      awsAccessKeyId: {
        description: 'Provide your AWS Access Key ID',
        pattern: /^[A-Z0-9]+$/,
        message: 'Invalid AWS Access Key ID',
        required: true
      },
      awsSecretKey: {
        description: 'Provide your AWS Secret Key',
        pattern: /^[a-zA-Z0-9\+\/\=]+$/,
        message: 'Invalid AWS Secret Key',
        required: true
      },
      includeOrganic: {
        description: `Include organic events in your uploads. Type 'true' or 'false'`
      },
      segmentKey: {
        description: 'Provide your Segment.io write key: (Enter nothing to disable Segment upload)',
        pattern: /^[a-zA-Z0-9]+$/,
        message: 'Invalid Segment write key',
      },
      segmentExcludedTopics: {
        description: `Comma separated list of events to exclude sending to Segment (Valid options: ${topics.join(', ')})`,
      },
      amplitudeKey: {
        description: 'Provide your Amplitude API key: (Enter nothing to disable Amplitude upload)',
        pattern: /^[a-zA-Z0-9]+$/,
        message: 'Invalid Amplitude API key',
      },
      amplitudeExcludedTopics: {
        description: `Comma separated list of events to exclude sending to Amplitude (Valid options: ${topics.join(', ')})`,
      },
      mixpanelToken: {
        description: 'Provide your Mixpanel Project Token: (Enter nothing to disable Mixpanel upload)',
        pattern: /^[a-zA-Z0-9]+$/,
        message: 'Invalid Mixpanel Token',
      },
      mixpanelAPIKey: {
        description: 'Provide your Mixpanel API key:',
        pattern: /^[a-zA-Z0-9]+$/,
        message: 'Invalid Mixpanel API key',
      },
      mixpanelExcludedTopics: {
        description: `Comma separated list of events to exclude sending to Mixpanel (Valid options: ${topics.join(', ')})`,
      }
    }
  }
}