import { APIGatewayProxyHandler, Context, Callback } from 'aws-lambda'
import axios from 'axios'
import 'source-map-support/register'
import * as moment from 'moment'
import dotenv from 'dotenv'

interface Response {
  statusCode: number,
  body: string,
  isBase64Encoded: boolean
}

export const hello: APIGatewayProxyHandler = async (_event: any = {}, _context: Context, callback: Callback): Promise<any> => {
  dotenv.config()
  // we subtract 2 days as the previous day may not yet be available resulting in an empty response
  const yesterday = moment().subtract(2, 'days').format('YYYY-MM-DD')
  axios.defaults.headers.common = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
  const api = axios.create({
    baseURL: "https://api2.branch.io/v3"
  });
  const response = await api.post('/export/', {
    branch_key: process.env.BRANCH_KEY,
    branch_secret: process.env.BRANCH_SECRET,
    export_date: yesterday
  })
  if (response instanceof Error) {
    callback(JSON.stringify(response), null)
    throw response
  }
  const result: Response = {
    statusCode: 200,
    body: JSON.stringify(translateResponse(response.data)),
    isBase64Encoded: false
  }
  console.debug('Exports requested successfully...')
  return result
}

function translateResponse(response: JSON): string[] {
  let result = Array<string>()
  for(const key in response) {
    result.push(response[key])
  }
  return result
}