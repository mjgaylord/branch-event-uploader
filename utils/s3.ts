import { s3 } from '../config/Config'
import * as pathUtil from 'path'

export async function getFile(bucket: string, filename: string): Promise<string> {
  console.debug(`Reading file: ${bucket}/${filename}`)
  const object = await s3.getObject({
    Bucket: bucket,
    Key: filename
  }).promise()
  return object.Body.toString()
}

export async function loadTemplates(bucket: string, path?: string): Promise<{}> {
  console.debug(`Reading bucket: ${bucket}`)
  const objects = await s3.listObjects({
    Bucket: bucket,
    Prefix: path || ''
  }, (error, data)=> {
    if (!!error) {
      throw new Error(`Unable to listObjects due to: ${error}`)
    }
    console.debug(`${JSON.stringify(data)}`)
  }).promise()
  const keys = objects.Contents.map(object => object.Key)
  let partials = {}
  const templates = await Promise.all(keys.map(key => loadTemplate(bucket, key)))
  templates.map(template => {
    partials[template.name] = template.contents   
  })
  console.debug(`partials: ${JSON.stringify(partials)}`)
  return partials
}

async function loadTemplate(bucket: string, key: string): Promise<Template> {
  const { name } = pathUtil.parse(key)
  console.info(`Loading template: ${name}`)
  const contents = await getFile(bucket, key)
  return { name, contents }
}

interface Template {
  name: string,
  contents: string
}