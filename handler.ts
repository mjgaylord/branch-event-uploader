import { APIGatewayProxyHandler, Context, Callback } from 'aws-lambda'
import axios from 'axios'
import 'source-map-support/register'
import * as moment from 'moment'

interface Response {
  statusCode: number,
  body: string,
  isBase64Encoded: boolean
}

export const hello: APIGatewayProxyHandler = async (_event: any = {}, _context: Context, callback: Callback): Promise<any> => {
  // we subtract 2 days as the previous day may not yet be available
  const yesterday = moment().subtract(2, 'days').format('YYYY-MM-DD')
  axios.defaults.headers.common = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
  const api = axios.create({
    baseURL: "https://api2.branch.io/v3"
  });
  const response = await api.post('/export/', {
    branch_key: 'key_live_hkDytPACtipny3N9XmnbZlapBDdj4WIL',
    branch_secret: 'secret_live_8CcBNYaLwvLM398sjTXOdptVf8EA57YP',
    export_date: yesterday
  })
  if (response instanceof Error) {
    callback(JSON.stringify(response), null)
    throw response
  }
  console.debug('Exports requested successfully...')
  const result: Response = {
    statusCode: 200,
    body: JSON.stringify(response.data),
    isBase64Encoded: false
  }
  return result
}

