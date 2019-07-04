import { APIGatewayProxyHandler, Context, Callback } from 'aws-lambda'
import * as rest from 'restler'
import 'source-map-support/register'
import * as moment from 'moment'

interface Response {
  statusCode: number,
  body: string,
  isBase64Encoded: boolean,
}

export const hello: APIGatewayProxyHandler = async (_event: any = {}, _context: Context, callback: Callback): Promise<any> => {
  const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')
  return new Promise<any>((resolve, reject) => {
    rest.post('https://api2.branch.io/v3/export/', {
      data: {
        'branch_key': 'key_live_hkDytPACtipny3N9XmnbZlapBDdj4WIL',
        'branch_secret': 'secret_live_8CcBNYaLwvLM398sjTXOdptVf8EA57YP',
        'export_date': yesterday
      }
    }).on('complete', function (result) {
      if (result instanceof Error) {
        callback(JSON.stringify(result), null)
        reject(result)
        return
      }
      console.debug('Exports requested successfully...')
      const response: Response = {
        statusCode: 200,
        body: JSON.stringify(result),
        isBase64Encoded: false
      }
      callback(undefined, response)
      resolve(JSON.stringify(result))
    })
  })
}

