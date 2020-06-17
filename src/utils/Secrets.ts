import { secretsManager } from '../utils/Config'

export enum Secret {
  SegmentWriteKey = "segmentKey",
  AmplitudeApiKey = "amplitudeKey",
  MixpanelToken = "mixpanelToken",
  MixpanelAPIKey = "mixpanelAPIKey"
}

export async function getSecret(secret: Secret): Promise<string> {
  const stage = process.env.STAGE
  const appName = process.env.APP_NAME
  const region = process.env.REGION
  const secretName = `${appName}-${stage}-${region}-${secret}`
  try {
    const secretValue = await secretsManager.getSecretValue({
      SecretId: secretName
    }).promise()
    if (!!secretValue.SecretString) {
      return secretValue.SecretString
    }
    throw Error(`Secret not defined, make sure to run 'npm run install' to ensure your environment is setup correctly.`)
  } catch(error) {
    console.error(`Unable to retreive secret: ${secretName} due to error: ${JSON.stringify(error)}`)
    throw error
  }
}