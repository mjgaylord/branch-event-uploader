import { APIGatewayProxyHandler, Context, Callback } from 'aws-lambda'
import axios from 'axios'
import 'source-map-support/register'
import * as moment from 'moment'
// @ts-ignore
import dotenv from 'dotenv'
import { Response, File, ServiceType, ExportRequestStatus, ExportRequest } from '../model/Models'
import { Database } from '../database/Database'
import { serviceType } from '../utils/Config'
import { getSecret, Secret } from '../utils/Secrets'

export const run: APIGatewayProxyHandler = async (_event: any = {}, _context: Context, _callback: Callback): Promise<any> => {
  dotenv.config()
  try {
    const database = new Database()
    // filter out requests we cannot retrieve (older than 7 days)
    const sevenDaysOld = moment().subtract(10, 'days')

    // list all unsuccessful requests
    let requests = (await database.listUnsuccessfulExportRequests()).filter(value => {
      return moment(value.dateRequested).isAfter(sevenDaysOld)
    })

    // save new request to database and add to list
    const currentRequestDate = moment().subtract(2, 'days')
    if (!requests.find(value => {
      return currentRequestDate.isSame(value.dateRequested, 'day')
    })) {
      const request = {dateRequested: currentRequestDate.toDate(), status: ExportRequestStatus.Empty}
      database.saveExportRequest(request)
      requests.push(request)
    }
    console.debug(`Outstanding export requests: ${JSON.stringify(requests)}`)
    // loop through list and make requests, save results to database
    const results = await Promise.all(requests.map(request => {
      return makeExportRequest(database, request)
    }))
    const files = [].concat(...results)
    const result: Response = {
      statusCode: 200,
      body: JSON.stringify(files),
      isBase64Encoded: false
    }
    console.debug('Records saved successfully in database.')    
    return result
  } catch (error) {
    console.error("Export files failed", error.message)
    const failed: Response = {
      statusCode: 400,
      body: (error.message || 'Unknown error'),
      isBase64Encoded: false
    }
    return failed
  }
}

async function makeExportRequest(database: Database, request: ExportRequest): Promise<File[]> {
  axios.defaults.headers.common = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
  console.info('Starting exports scheduler...')
  const api = axios.create({
    baseURL: "https://api2.branch.io/v3"
  })
  try {
    const key = await getSecret(Secret.BranchKey)
    const secret = await getSecret(Secret.BranchSecret)
    const requestDate = moment(request.dateRequested).format('YYYY-MM-DD')
    console.debug(`Performing request for: ${requestDate}`)
    const response = await api.post('/export/', {
      branch_key: key,
      branch_secret: secret,
      export_date: requestDate
    })
    console.debug('Exports requested successfully. Saving to database...')
    const files = translateResponse(response.data)
    await database.saveFiles(files)
    if (files.length > 0) {
      request.status = ExportRequestStatus.Success
      await database.saveExportRequest(request)
    }
    return files
  } catch (error) {
    request.status = ExportRequestStatus.Failed
    await database.saveExportRequest(request)
    throw error
  }
}

export function translateResponse(response: ExportResponse): File[] {
  let result = Array<File>()
  const type = serviceType()
  for(const key in response) {
    response[key].forEach(file => {
      result.push({
        downloadPath: file,
        downloaded: false, 
        pathAvailable: type === ServiceType.Branch ? true : false,
        type
      })  
    });
  }
  return result
}