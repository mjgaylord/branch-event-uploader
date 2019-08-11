import { ServiceType } from "../model/Models"
import * as AWS from 'aws-sdk'

export function serviceType(): ServiceType {
  const env = process.env.SERVICE_TYPE || 'Branch'
  if (env === 'Tune'){
    return ServiceType.Tune
  }
  return ServiceType.Branch
}

export const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.ACCESS_SECRET_KEY,
  region: 'us-east-1'
})

export const lambda = new AWS.Lambda({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.ACCESS_SECRET_KEY,
  region: 'us-east-1'
});

export const templatesBucket = process.env.TEMPLATES_BUCKET