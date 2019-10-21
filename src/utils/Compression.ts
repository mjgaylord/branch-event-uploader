import * as zlib from 'zlib'

export async function compressString(value?: string): Promise<Buffer | undefined> {
  if (!value) {
    return undefined
  }
  return new Promise<Buffer>((resolve, _reject) => {
    zlib.deflate(value, (error, data) => {
      if(!!error) {
        resolve(undefined)
        return
      }
      resolve(data)
    })
  })
}

export async function decompressString(buffer: Buffer): Promise<string | undefined> {
  if (!buffer) {
    return undefined
  }
  return new Promise<string>((resolve, _reject) => {
    zlib.inflate(buffer, (error, result) => {
      if (!!error) {
        resolve(undefined)
        return
      }
      resolve(result.toString())
    })
  })
}
