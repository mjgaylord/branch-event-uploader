![Data Flow](docs/flow.png)

# Setup

Install Homebrew

Run `brew install node`

Install serverless `npm -g install serverless`
Install typescript `npm install -g typescript`

Then run `npm install` from the root folder to install dependencies

Test by running `serverless --help`

Run `sls config credentials --provider aws --key {key} --secret {secret}` to complete your setup.

Note: After ran the above to setup the right credentials,just run npm run deploy and willl automatically configure your services. No need for extra setup on AWS

# Deployment

Run `sls deploy --verbose`

# Testing

Visit https://console.aws.amazon.com/lambda/home

## Using Serverless Offline

Create a `.env` file in the root folder that looks like:

```
BRANCH_KEY=key_live...
BRANCH_SECRET=secret_live...
ACCESS_KEY_ID={AWS_ACCESS_KEY_ID - used to access S3 and Lambda}
ACCESS_SECRET_KEY={ACCESS_SECRET_KEY - used to access S3 and Lambda}
SERVICE_TYPE=Branch { either Branch or Tune as Tune exports function differently}
OFFLINE=true // For offline DynamoDB support.
```

1. Install Docker here: https://docs.docker.com/docker-for-mac/install/
2. Run `brew install docker`
3. Run `docker pull lambci/lambda`
4. Run `npm run install:dynamodb`
5. Run `npm run s3:create:bucket`
6. Run `npm run start`

Email reports:
In order to send email reports you will need to verify the email addresses that need to send those reports, this can be done from the AWS console here: https://console.aws.amazon.com/ses/home?region=us-east-1#verified-senders-email:

Local services will now be available at http://localhost:4000/
