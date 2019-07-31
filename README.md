![Data Flow](docs/flow.png)

# Setup

Install Homebrew

Run `brew install node`

Install serverless `npm -g install serverless`
Install typescript `npm install -g typescript`

Then run `npm install` from the root folder to install dependencies

Test by running `serverless --help`

Run `sls config credentials --provider aws --key {key} --secret {secret}` to complete your setup

# Deployment

Run `sls deploy --verbose`

# Testing

Visit https://console.aws.amazon.com/lambda/home

## Using Serverless Offline

Create a `.env` file in the root folder that looks like:

```
BRANCH_KEY=key_live...
BRANCH_SECRET=secret_live...
```

1. Install Docker here: https://docs.docker.com/docker-for-mac/install/
2. Run `brew install docker`
3. Run `docker pull lambci/lambda`
4. Run `sls offline start`

Local services will now be available at http://localhost:3000/
