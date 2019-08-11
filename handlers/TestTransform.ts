//@ts-ignore
import Analytics from 'analytics-node'
import { APIGatewayProxyHandler, Context, Callback } from 'aws-lambda'
import { getFile, loadTemplates } from '../utils/s3'
import { templatesBucket } from '../config/Config'
import { transformAndUpload } from './Transform'
import { Response } from '../model/Models';

export const run: APIGatewayProxyHandler = async (event: any = {}, _context: Context, _callback: Callback): Promise<any> => {
  console.info('Starting test transformer...')
  
  try {
    const { body } = event
    let { template, partials, events } = JSON.parse(body)
    if (template === undefined) {
      template = await getFile(templatesBucket, 'SEGMENT.mst')
      partials = await loadTemplates(templatesBucket, 'partials')
    }
    console.debug(`${JSON.stringify(partials.campaign)}`)
    const uploadResult = await transformAndUpload(events.events, template, partials)
    if ((uploadResult.errors.length) > 0) {
      console.debug(`${JSON.stringify(uploadResult.errors.map(e => e.reason))}`)
      const failed: Response = {
        statusCode: 400,
        body: `There were errors uploading events to Segment.\nTotal events: ${uploadResult.totalEvents}\nError count: ${uploadResult.errors.length}`,
        isBase64Encoded: false
      }
      return failed
    }
    const result: Response = {
      statusCode: 200,
      body: `Upload successful\nTotal events uploaded: ${uploadResult.totalEvents}`,
      isBase64Encoded: false
    }
    return result
  } catch (error) {
    console.error(`Error transforming events: ${error}`)
    return {
      statusCode: 400,
      body: (error.message || 'Unknown error'),
      isBase64Encoded: false
    }
  }
}