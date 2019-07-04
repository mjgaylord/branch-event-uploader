# Setup

Install Homebrew

Run `brew install node`


Install serverless `npm -g install serverless`
Install typescript `npm install -g typescript`

Then run `npm install` from the root folder to install dependencies

Test by running `serverless --help`

Run `sls config credentials --provider aws --key {key} --secret {secret}` to complete your setup

# Deployment

Run `sls deploy — verbose`

# Testing

Visit https://console.aws.amazon.com/lambda/home

