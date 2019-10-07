![Data Flow](docs/flow.png)

# Setup

Install Homebrew

Run `brew install node`

Install serverless `npm -g install serverless`
Install typescript `npm install -g typescript`

Then run `npm install` from the root folder to install dependencies

Test by running `serverless --help`

Note: You may need to install Docker for deployment to work if you have not installed it already. The simplest is to install Docker Desktop: https://docs.docker.com/install/

Run `npm run install` to configure your serverless environment (note you may need to add your AWS Access Key ID and Secret to the package.json setup script)

If you want to avoid the prompts you can create a `.env` file in the root of your project and add the following:

```
{
  "appName": // your app name - this needs to be unique,
  "stage": // either dev, stg or prd,
  "region": // AWS region e.g. us-east-1,
  "awsAccessKeyId": // AWS key id used to create buckets and upload files,
  "awsSecretKey": // AWS secret key,
  "branchKey": // Branch key off of the Branch dashboard https://branch.dashboard.branch.io/account-settings
  "branchSecret": // Branch secret off of the Branch dashboard https://branch.dashboard.branch.io/account-settings
  "emailReceivers": //Comma seperated list of report receivers to which reports will be sent, these need to be verified on AWS,
  "emailSender": // Email address from which report will be sent,
  "segmentKey": // If using Segment enter your Segment.com write key,
  "segmentExcludedTopics": // Events to exclude from the upload see below,
  "amplitudeKey": // If using Amplitude, your Amplitude API key,
  "amplitudeExcludedTopics": // Events to exclude from the upload see below,
}
```

Possible event types that can be excluded from being uploaded:   
```
Click
View
Commerce
Content
Install
Open
PageView
Reinstall
SMSSent
UserLifecycleEvent
WebSessionStart
WebToAppAutoRedirect
```

# Deployment & Updating

Run `npm run update`

# Post deployment setup

CloudFormation configuration of bucket events has not yet been implemented, so it is important to enable the exports bucket to trigger the transform Lambda on all create events.

Cloudwatch events also need to be setup to schedule event triggers on `start` and `download` lambdas. The `start` event can be triggered to run every 6-12 hours. The `download` can be triggered every 3-6 hours. The results of these calls are idempotent.

# TODOs:
- Automate both Cloudwatch events and bucket create events
- Add support for marking uploads as complete in DynamoDB
- Add manual retry capability
- Add support for Mixpanel
- Improve test coverage
