import { APIGatewayEvent, Context, Callback, APIGatewayProxyHandler } from "aws-lambda"
import { UploadResult, UploadResultStatus, Response, JobReport } from "../model/Models"
import { reportReceivers, reportSender, templatesBucket } from "../utils/Config"
import { sendEmail } from "../database/Email"
import { initMustache } from "../transformers/Transformer"
import { getFile } from "../utils/s3"
import * as Mustache from 'mustache'

export const run: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context, _callback: Callback) => {
  //@ts-ignore
  const uploadResult: UploadResult = event.result
  console.info(`Send job report for result: ${JSON.stringify(uploadResult)}`)
  const subject = subjectFromResult(uploadResult)
  const recipients = reportReceivers.split(',').map(v => v.trim())
  const sender = reportSender
  const text = await bodyText(uploadResult)
  // const html = await bodyHtml(uploadResults)

  const params = { 
    Source: sender, 
    Destination: { 
      ToAddresses: recipients,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8"
      },
      Body: {
        Text: {
          Data: text,
          Charset: "UTF-8" 
        }
      }
    }
  }
  try {
    const success = await sendEmail(params)
    const result: Response = {
      statusCode: 200,
      body: JSON.stringify(success),
      isBase64Encoded: false
    }
    return result
  } catch (error) {
    console.warn(`Error sending email due to: ${JSON.stringify(error.message)}`)
    const failed: Response = {
      statusCode: 400,
      body: (error.message || 'Unknown error'),
      isBase64Encoded: false
    }
    return failed
  }
}

const subjectFromResult = (result: UploadResult): string => {
  switch (result.status) {
    case UploadResultStatus.ContainsErrors:
      return "Data Export Contains Errors"
    case UploadResultStatus.Failed:
      return "Data Export Failed"
    case UploadResultStatus.Successful:
      return "Data Export Succeeded"
  }
}

const bodyText = async (result: UploadResult): Promise<string> => {
  return render(result, "email/JOBREPORT_plain.mst")
}

const render = async (result: UploadResult, templatePath: string) : Promise<string> => {
  const template = await getFile(templatesBucket, templatePath)
  initMustache(template)
  const reports = reportFromResult(result)
  return Mustache.render(template, { reports })
}

const reportFromResult = (result: UploadResult): JobReport => {
  
    return {
      totalBatches: result.totalBatches,
      totalEvents: result.totalEvents,
      date: result.dateOfFile,
      filename: result.file,
    }
}