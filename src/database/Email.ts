import * as AWS from 'aws-sdk'
import dotenv from 'dotenv'
import { SendEmailRequest } from 'aws-sdk/clients/ses'

export function sendEmail(request: SendEmailRequest): Promise<any> {
  AWS.config.update({ region: process.env.REGION })
  dotenv.config()
  const ses = new AWS.SES()
  return new Promise<any>((resolve, reject) => {
    ses.sendEmail(request, function (err, data) {
      // If something goes wrong, print an error message.
      if (!!err) {
        reject(err)
        return
      }
      resolve(data.MessageId)
    })
  })
}