import { APIGatewayEvent, Context, Callback, APIGatewayProxyHandler } from "aws-lambda"
import { UploadResult, UploadResultStatus, Response, JobReport } from "../model/Models"
import { reportReceivers, reportSender, templatesBucket } from "../utils/Config"
import { sendEmail } from "../database/Email"
import { initMustache } from "../transformers/Transformer"
import { getFile } from "../utils/s3"
import * as Mustache from 'mustache'

export const run: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context, _callback: Callback) => {
  //@ts-ignore
  const uploadResults: Array<UploadResult> = event.results
  console.info(`Send job report for result: ${JSON.stringify(uploadResults)}`)
  const subject = subjectFromResult(uploadResults)
  const recipients = reportReceivers.split(',').map(v => v.trim())
  const sender = reportSender
  const text = await bodyText(uploadResults)
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
        // Html: {
        //   Data: html,
        //   Charset: "UTF-8"
        // }
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

const subjectFromResult = (results: Array<UploadResult>): string => {
  const reducedStatus = results.reduce((previousStatus: UploadResultStatus, currentValue, _currentIndex, _array) => {
    if (previousStatus === UploadResultStatus.Failed || 
      previousStatus === UploadResultStatus.ContainsErrors) {
      return currentValue.status
    }
    return currentValue.status
  }, UploadResultStatus.Successful)
  switch (reducedStatus) {
    case UploadResultStatus.ContainsErrors:
      return "Data Export Contains Errors"
    case UploadResultStatus.Failed:
      return "Data Export Failed"
    case UploadResultStatus.Successful:
      return "Data Export Succeeded"
  }
}

const bodyText = async (results: Array<UploadResult>): Promise<string> => {
  return render(results, "email/JOBREPORT_plain.mst")
}

// const bodyHtml = async (results: Array<UploadResult>): Promise<string> => {
//   return render(results, "email/JOBREPORT_html.mst")
// }

const render = async (results: Array<UploadResult>, templatePath: string) : Promise<string> => {
  const template = await getFile(templatesBucket, templatePath)
  initMustache(template)
  const reports = reportFromResults(results)
  return Mustache.render(template, { reports })
}

const reportFromResults = (results: Array<UploadResult>): Array<JobReport> => {
  return results.map(r => {
    return {
      service: r.service,
      events_count: r.totalEvents,
      failed_events_count: r.errors.length,
      errors: r.errors.slice(0, r.errors.length > 50 ? 50 : r.errors.length).map(e => e.reason),
      date: r.dateOfFile,
      filename: r.file
    }
  })
}