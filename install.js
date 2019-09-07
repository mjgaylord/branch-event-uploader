const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const prompt = require('prompt')
const prompts = require('./prompts')

const templatesBucketSuffix = 'data-export-transform-templates'

module.exports.install = async function () {
  //add keys
  const result = await this.initialiseConfig()
  console.log(`Configured keys: ${JSON.stringify(Object.keys(result))}`)

  let awsConfig = {
    accessKeyId: result["awsAccessKeyId"],
    secretAccessKey: result["awsSecretKey"],
    region: result["region"]
  }

  //create AWS Secrets Manager entries for the keys
  const secretKeys = ["awsAccessKeyId", "awsSecretKey", "branchKey", "branchSecret", "amplitudeKey", "segmentKey"]
  let secrets = {}
  Object.keys(result)
    .filter(k => secretKeys.find(p => p === k) && result[k].length > 0)
    .forEach(k => secrets[k] = result[k])

  try {
    const uploadResults = await this.uploadSecrets(secrets, result)
    console.log(`Secrets uploaded to Secrets Manager`)
  } catch (error) {
    console.log(JSON.stringify(error))
  }

  const services = this.servicesFromSecrets(secrets)
  const bucket = `${result.appName}-${result.stage}-${templatesBucketSuffix}`
  let userConfig = { templatesBucket:  bucket, services }
  Object.keys(result)
    .filter(k => !secretKeys.find(p => p === k) && result[k].length > 0)
    .forEach(k => userConfig[k] = result[k])
  await this.saveConfig(userConfig)

  const s3 = new AWS.S3(awsConfig)
  await this.createBucket(s3, bucket)
  await this.copyTemplates(s3, bucket)
}

module.exports.initialiseConfig = async function () {
  const envPath = path.join(__dirname, '.env')
  try {
    const result = await this.readFile(envPath)
    return JSON.parse(result.toString())
  } catch (error) {
    console.log(`.env not found, loading config from prompts`)
  }
  prompt.start()
  const result = await new Promise((resolve, reject) => {
    prompt.get(prompts.prompts(), function (err, result) {
      if (!!err) {
        reject(err)
        return
      }
      resolve(result)
    })
  })
}

module.exports.createBucket = async function (s3, bucket) {
  const params = {
    Bucket: bucket
  }
  const { Buckets } = await s3.listBuckets().promise()
  if (!!Buckets.find(b => b.Name === bucket)) {
    console.log(`Bucket already exists, skipping...`)
    return
  }
  console.log(`Creating bucket: ${bucket}`)
  await s3.createBucket(params).promise()
}

module.exports.copyTemplates = async function (s3, bucket) {
  const templatesFolder = path.join(__dirname, 'templates')
  const files = await this.readDir(templatesFolder)
  if (!files || files.length === 0) {
    console.log(`${templatesFolder} is empty or does not exist.`)
    return
  }
  await Promise.all(files.map(fileName => {
    const filePath = path.join(templatesFolder, fileName)
    if (fs.lstatSync(filePath).isDirectory()) {
      const { name } = path.parse(fileName)
      return this.uploadDirectory(s3, filePath, `${bucket}/${name}`)
    }
    return this.uploadFile(s3, filePath, bucket)
  }))
}

module.exports.uploadFile = async function (s3, filePath, bucket) {
  const { name, ext } = path.parse(filePath)
  const fileContent = await this.readFile(filePath)
  console.log(`Uploading file: ${filePath} to: ${bucket}`)
  await s3.putObject({
    Bucket: bucket,
    Key: `${name}${ext}`,
    Body: fileContent
  }).promise()
  console.log(`Successfully uploaded ${name}`)
}

module.exports.uploadDirectory = async function (s3, folder, bucket) {
  console.log(`Uploading: ${folder} to: ${bucket}`)
  const files = await this.readDir(folder)
  if (!files || files.length === 0) {
    return
  }
  return Promise.all(files.map(fileName => {
    const filePath = path.join(folder, fileName)
    //recurse if it is a directory
    if (fs.lstatSync(filePath).isDirectory()) {
      console.log(`${filePath} is a sub-folder, syncing...`)
      const { name } = path.parse(filePath)
      return this.uploadDirectory(s3, filePath, `${bucket}/${name}`)
    }
    return this.uploadFile(s3, filePath, bucket)
  }))
}

module.exports.readFile = async function (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

module.exports.readDir = async function (path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, async (err, files) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(files)
    })
  })
}

module.exports.uploadSecrets = async function (secrets, config) {
  console.log(`Uploading secrets: ${JSON.stringify(secrets)}`)
  const secretsManager = new AWS.SecretsManager({
    accessKeyId: config["awsAccessKeyId"],
    secretAccessKey: config["awsSecretKey"],
    region: config["region"]
  })
  const { appName, stage, region } = config
  return Promise.all(Object.keys(secrets).map(async key => {
    const secretName = `${appName}-${stage}-${region}-${key}`
    const value = secrets[key]
    console.log(`Uploading secret: ${key}`)
    try {
      const result = await secretsManager.putSecretValue({
        SecretId: secretName,
        SecretString: value
      }).promise()
      return result
    } catch (error) {
      if (error.code !== "ResourceNotFoundException") {
        console.log(`Error updating secret: ${JSON.stringify(error)}`)
      }
    }
    return secretsManager.createSecret({
      Name: secretName,
      SecretString: value
    }).promise()
  }))
}

module.exports.saveConfig = async function (config) {
  const filePath = path.join(__dirname, 'config.json')
  console.log(`Saving ${filePath}: ${JSON.stringify(config)}`)
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(config), function (err) {
      if (!!err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

module.exports.servicesFromSecrets = function (secrets) {
  return Object.keys(secrets).filter(k => {
    return k === 'amplitudeKey' || k === 'segmentKey'
  }).map(k => {
    if (k === 'amplitudeKey') return "Amplitude"
    if (k === 'segmentKey') return "Segment"
  }).join(",")
}