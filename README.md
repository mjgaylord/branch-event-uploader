
# Overview

This software is able to transform and upload raw event data to multiple destinations. Supported destinations are:
  - Segment
  - Mixpanel
  - Amplitude

Please open a PR should you wish to include a new export destination.

# Features
  - Tested to support files up to 1GB in size
  - Simple interactive CLI setup
  - Low cost - runs on Lambda, DynamoDB and S3
  - Automatic retry
  - Error log storage
  - Upload file exclusion support
  - Securely stores all API keys and secrets

# Setup

Create a bucket on S3 to store your event files or get the name of the bucket you would like to use with this upload service. e.g. `my-exported-event-data-bucket`

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
  "segmentKey": // If using Segment enter your Segment.com write key,
  "segmentExcludedTopics": // Events to exclude from the upload see below,
  "amplitudeKey": // If using Amplitude, your Amplitude API key,
  "amplitudeExcludedTopics": // Events to exclude from the upload see below,
  "mixpanelAPIKey": // Your Mixpanel API key,
  "mixpanelToken": // Your Mixpanel token,
  "mixpanelExcludedTopics": // Event to exclude from the upload see below,
  "includeOrganic": //"true" or "false" (as String values). Organic events will be ignored from uploading
  "downloadsBucket": "my-exported-event-data-bucket"
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

# AWS Setup

If you don't already have an AWS account visit: https://aws.amazon.com to create one.

Next create an IAM User with programmatic access and the following policy permissions:

- SecretsManagerReadWrite
- AWSLambdaFullAccess
- AmazonDynamoDBFullAccess
- AmazonAPIGatewayAdministrator
- AWSCodeDeployRoleForLambda
- AWSDeepRacerCloudFormationAccessPolicy
- IAMFullAccess

Save the AWS key and secret for later use

Install the AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html

*Note:* if you already have the AWS CLI installed make sure the credentials in the `~/.aws/credentials` file match the use you just created above.

# Deployment & Updating

Run `npm run update`

All setup at this point should be complete.
